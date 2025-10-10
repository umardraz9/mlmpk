import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { db as prisma } from '@/lib/db'
import { resolvePlanByName } from '@/lib/plans'
import { validateTaskAccess } from '@/lib/task-country-middleware'

// Helper function to get global task amount setting from config
// For now, we'll use environment variable or default to null (use plan-specific)
function getGlobalTaskAmount(): number | null {
  const globalAmount = process.env.GLOBAL_TASK_AMOUNT
  return globalAmount ? parseInt(globalAmount, 10) : null
}

// GET - Get tasks for current user
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Tasks API called, checking country restrictions...')
    
    // Check country restrictions first
    const countryBlockResponse = await validateTaskAccess(request)
    if (countryBlockResponse) {
      console.log('🚫 Country blocking activated, returning block response')
      return countryBlockResponse
    }

    console.log('✅ Country check passed, proceeding with normal flow')
    const session = await requireAuth()
    
    console.log('User attempting task completion:', session.user.email)
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause for tasks
    const taskWhere: any = {
      status: 'ACTIVE'
    }
    
    if (type) taskWhere.type = type
    if (category) taskWhere.category = category

    // Load user with membership info and plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        membershipPlan: true,
        membershipStatus: true,
        membershipStartDate: true,
        membershipEndDate: true,
        earningsContinueUntil: true,
        tasksEnabled: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 })
    }

    let plan: any = null
    if (user?.membershipPlan) {
      const normalizedPlan = (user.membershipPlan || '').toUpperCase()
      if (normalizedPlan) {
        plan = await prisma.membershipPlan.findFirst({
          where: {
            OR: [
              { name: normalizedPlan },
              { name: user.membershipPlan }
            ]
          }
        })
        // Fallback to default definitions when DB has no plans yet
        if (!plan) {
          plan = await resolvePlanByName(prisma as any, user.membershipPlan)
        }
      }
    }

    // Ensure we have a plan object; set dailyTaskEarning to 0 so reward calc falls back to 30
    if (!plan) {
      plan = {
        name: 'DEFAULT',
        tasksPerDay: 5,
        dailyTaskEarning: 0,
        maxEarningDays: 365
      }
    }

    const now = new Date()
    // Referral gating rules: 30 days free, then requires qualifying referral(s) based on plan
    const membershipStart = user?.membershipStartDate || user?.createdAt || now
    const thirtyDaysAfterStart = new Date(membershipStart)
    thirtyDaysAfterStart.setDate(thirtyDaysAfterStart.getDate() + 30)

    let qualifyingReferral = false
    if (user?.membershipStatus === 'ACTIVE') {
      const referrals = await prisma.user.findMany({
        where: { sponsorId: session.user.id },
        select: { membershipPlan: true }
      })

      const planName = (user?.membershipPlan || '').toUpperCase()
      if (planName === 'BASIC') {
        qualifyingReferral = referrals.length > 0
      } else if (planName === 'STANDARD') {
        qualifyingReferral = referrals.some(r => (r.membershipPlan || '').toUpperCase() === 'STANDARD' || (r.membershipPlan || '').toUpperCase() === 'PREMIUM')
      } else if (planName === 'PREMIUM') {
        qualifyingReferral = referrals.some(r => (r.membershipPlan || '').toUpperCase() === 'PREMIUM')
      } else {
        // Unknown plan: require at least one referral after 30 days
        qualifyingReferral = referrals.length > 0
      }
    }

    const isWithinFirst30Days = now <= thirtyDaysAfterStart
    const baseEligible = !!user && user.membershipStatus === 'ACTIVE' && user.tasksEnabled
    const isEligible = baseEligible && (isWithinFirst30Days || qualifyingReferral)

    // Calculate per-task reward with consistent fallback
    const globalTaskAmount = getGlobalTaskAmount()
    let perTaskReward: number
    if (globalTaskAmount && globalTaskAmount > 0) {
      perTaskReward = globalTaskAmount
    } else if (plan && (plan as any).id) {
      const tasksPerDayVal = plan?.tasksPerDay ?? 5
      const dailyEarning = plan?.dailyTaskEarning ?? 0
      perTaskReward = dailyEarning > 0 ? Math.round(dailyEarning / tasksPerDayVal) : 30
    } else {
      // If plan is from defaults (no id) or missing entirely, use constant 30
      perTaskReward = 30
    }

    const tasksPerDay = plan?.tasksPerDay ?? 5

    // Get active tasks
    const [tasks, userCompletions, userStats] = await Promise.all([
      prisma.task.findMany({
        where: taskWhere,
        skip,
        take: limit,
        orderBy: [
          { type: 'asc' },
          { createdAt: 'desc' }
        ],
        select: ({
          id: true,
          title: true,
          description: true,
          type: true,
          category: true,
          difficulty: true,
          reward: true,
          target: true,
          timeLimit: true,
          instructions: true,
          icon: true,
          color: true,
          completions: true,
          attempts: true,
          status: true,
          createdAt: true,
          // Article tracking fields
          articleUrl: true,
          minDuration: true,
          requireScrolling: true,
          requireMouseMovement: true,
          minScrollPercentage: true,
          maxAttempts: true,
          minAdClicks: true
        } as any)
      }),
      prisma.taskCompletion.findMany({
        where: { userId: session.user.id },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              type: true,
              category: true,
              reward: true
            }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          balance: true,
          totalPoints: true,
          totalEarnings: true,
          tasksCompleted: true,
          createdAt: true
        }
      })
    ])

    // Create completion map for easy lookup
    const completionMap = new Map(
      userCompletions.map(completion => [completion.taskId, completion])
    )

    // Calc today's completions for daily-limit gating
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const completionsToday = userCompletions.filter(c => c.completedAt && new Date(c.completedAt) >= today).length

    // Enrich tasks with user completion status and ensure article fields and per-plan reward
    const enrichedTasks = (tasks as any[]).map((task: any) => {
      const completion = completionMap.get(task.id)
      
      // Auto-populate article fields for content tasks that don't have them
      let enrichedTask: any = { ...task }
      
      if (!task.articleUrl && (
        task.type === 'CONTENT_ENGAGEMENT' || 
        task.category === 'content' || 
        task.title.toLowerCase().includes('read') ||
        task.description.toLowerCase().includes('read') ||
        task.description.toLowerCase().includes('article')
      )) {
        console.log(`Auto-populating article fields for task: ${task.title}`)
        enrichedTask = {
          ...task,
          articleUrl: 'https://contentmarketinginstitute.com/articles/content-marketing-strategies/',
          minDuration: 45,
          requireScrolling: true,
          requireMouseMovement: true,
          minScrollPercentage: 70,
          maxAttempts: 3,
          minAdClicks: 0
        }
      }
      
      return {
        ...enrichedTask,
        reward: perTaskReward, // override reward by plan
        userCompletion: completion || null,
        canStart: isEligible && (completionsToday < tasksPerDay) && (!completion || completion.status === 'FAILED'),
        isCompleted: completion?.status === 'COMPLETED',
        isInProgress: completion?.status === 'IN_PROGRESS',
        progress: completion?.progress || 0,
        requiresReferral: !isEligible
      }
    })

    // Filter by completion status if requested
    let filteredTasks = enrichedTasks
    if (status === 'completed') {
      filteredTasks = enrichedTasks.filter(task => task.isCompleted)
    } else if (status === 'available') {
      filteredTasks = enrichedTasks.filter(task => task.canStart)
    } else if (status === 'in_progress') {
      filteredTasks = enrichedTasks.filter(task => task.isInProgress)
    }

    // Get user leaderboard position
    const userRank = await getUserRank(session.user.id)

    return NextResponse.json({
      tasks: filteredTasks.map(task => ({
        ...task,
        reward: task.reward,
        currency: 'PKR'
      })),
      userStats: {
        balance: userStats.balance,
        totalPoints: userStats.totalPoints,
        totalEarnings: userStats.totalEarnings,
        tasksCompleted: userStats.tasksCompleted,
        rank: userRank,
        completionsToday,
        completionsThisWeek: userCompletions.filter(c => 
          c.completedAt && 
          isThisWeek(new Date(c.completedAt))
        ).length,
        tasksPerDay,
        eligible: isEligible,
        earningEndsAt: user?.earningsContinueUntil || null
      },
      pagination: {
        page,
        limit,
        total: filteredTasks.length
      }
    })
  } catch (error) {
    console.error('❌ Error fetching tasks:', error)
    console.error('Stack trace:', error.stack)
    
    // More specific error handling
    if ((error as any)?.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Unauthorized: Please sign in to view tasks',
        code: 'UNAUTHORIZED'
      }, { status: 401 })
    }
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 })
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      message: (error as any)?.message,
      code: (error as any)?.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check country restrictions first
    const countryBlockResponse = await validateTaskAccess(request)
    if (countryBlockResponse) {
      return countryBlockResponse
    }

    const session = await requireAuth()

    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Load user and plan for eligibility and limits
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        membershipPlan: true,
        membershipStatus: true,
        earningsContinueUntil: true,
        tasksEnabled: true
      }
    })

    // If membership is not ACTIVE, but a verified payment exists, auto-activate as a safe fallback
    if (user && user.membershipStatus !== 'ACTIVE') {
      const [verifiedManual, approvedConfirmation] = await Promise.all([
        prisma.manualPayment.findFirst({ where: { userId: session.user.id, status: 'VERIFIED' }, select: { id: true } }),
        prisma.paymentConfirmation.findFirst({ where: { userId: session.user.id, status: { in: ['VERIFIED', 'APPROVED'] } }, select: { id: true } })
      ])
      const hasApprovedPayment = !!verifiedManual || !!approvedConfirmation
      if (hasApprovedPayment) {
        const plan = user.membershipPlan ? await prisma.membershipPlan.findUnique({ where: { name: user.membershipPlan } }) : null
        const now = new Date()
        const endDate = plan ? new Date(now.getTime() + (plan.maxEarningDays * 24 * 60 * 60 * 1000)) : null
        await prisma.user.update({
          where: { id: user.id },
          data: {
            membershipStatus: 'ACTIVE',
            tasksEnabled: true,
            membershipStartDate: now,
            ...(endDate ? { membershipEndDate: endDate, earningsContinueUntil: endDate } : {})
          }
        })
        // refresh user state minimally
        user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            membershipPlan: true,
            membershipStatus: true,
            earningsContinueUntil: true,
            tasksEnabled: true
          }
        })
      }
    }

    // Allow ACTIVE users with tasksEnabled to start tasks (do not block on earning period)
    if (!user || user.membershipStatus !== 'ACTIVE' || !user.tasksEnabled) {
      return NextResponse.json({ 
        error: 'Task access disabled. Please check your account status.',
        errorCode: 'NOT_ELIGIBLE'
      }, { status: 403 })
    }

    const plan = user.membershipPlan ? await prisma.membershipPlan.findUnique({ where: { name: user.membershipPlan } }) : null
    const tasksPerDay = plan?.tasksPerDay ?? 5

    // Check if task exists and is active
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task || task.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Task not found or inactive' }, { status: 404 })
    }

    // Get user stats
    const userStats = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        balance: true,
        totalPoints: true,
        totalEarnings: true,
        tasksCompleted: true,
        createdAt: true
      }
    })

    if (!userStats) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userCompletions = await prisma.taskCompletion.findMany({
      where: { userId: session.user.id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            reward: true
          }
        }
      }
    })

    // Check daily task limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dailyCompletions = userCompletions.filter(c => c.completedAt && new Date(c.completedAt) >= today).length
    if (dailyCompletions >= tasksPerDay) {
      return NextResponse.json({ 
        error: `Daily task limit reached. Maximum ${tasksPerDay} tasks per day.`,
        errorCode: 'DAILY_LIMIT_REACHED'
      }, { status: 429 })
    }

    // Check if user already has this task
    const existingCompletion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: taskId
        }
      }
    })

    if (existingCompletion && existingCompletion.status !== 'FAILED') {
      return NextResponse.json({ 
        error: 'Task already started or completed',
        errorCode: 'TASK_ALREADY_STARTED',
        taskStatus: existingCompletion.status
      }, { status: 400 })
    }

    // Create or update task completion
    const taskCompletion = await prisma.taskCompletion.upsert({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: taskId
        }
      },
      update: {
        status: 'IN_PROGRESS',
        progress: 0,
        startedAt: new Date()
      },
      create: {
        userId: session.user.id,
        taskId: taskId,
        status: 'IN_PROGRESS',
        progress: 0
      }
    })

    // Update task attempts
    await prisma.task.update({
      where: { id: taskId },
      data: {
        attempts: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Task started successfully',
      taskCompletion: taskCompletion,
      id: taskCompletion.id
    })
  } catch (error) {
    console.error('❌ Error starting task:', error)
    console.error('Stack trace:', error.stack)
    
    // More specific error handling
    if ((error as any)?.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Unauthorized: Please sign in to start tasks',
        code: 'UNAUTHORIZED'
      }, { status: 401 })
    }
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ 
        error: 'Task completion already exists',
        code: 'DUPLICATE_COMPLETION'
      }, { status: 400 })
    }
    
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ 
        error: 'Task or user not found',
        code: 'RECORD_NOT_FOUND'
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Internal server error', 
      message: (error as any)?.message,
      code: (error as any)?.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}

// Helper functions
async function getUserRank(userId: string): Promise<number> {
  const users = await prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    orderBy: { totalPoints: 'desc' },
    select: { id: true }
  })
  
  return users.findIndex(user => user.id === userId) + 1
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  weekStart.setHours(0, 0, 0, 0)
  
  return date >= weekStart
}