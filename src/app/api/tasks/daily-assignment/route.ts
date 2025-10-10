import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    // Get user with membership plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        membershipPlan: true,
        membershipStatus: true,
        tasksEnabled: true,
        lastTaskCompletionDate: true,
        dailyTasksCompleted: true,
        earningsContinueUntil: true,
        membershipStartDate: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Check if user has active membership
    if (user.membershipStatus !== 'ACTIVE') {
      return NextResponse.json({ 
        success: false, 
        error: 'Active membership required to receive daily tasks' 
      }, { status: 403 })
    }

    // Check if tasks are enabled for user (admin control)
    if (!user.tasksEnabled) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tasks are disabled for your account. Please contact admin.' 
      }, { status: 403 })
    }

    // Get membership plan details
    const plan = await prisma.membershipPlan.findUnique({
      where: { name: user.membershipPlan! }
    })

    if (!plan) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid membership plan' 
      }, { status: 400 })
    }

    // Check earning continuation (30 days without referrals, then requires ≥1 referral)
    const now = new Date()
    const membershipStart = user.membershipStartDate || now
    const thirtyDaysAfterStart = new Date(membershipStart)
    thirtyDaysAfterStart.setDate(thirtyDaysAfterStart.getDate() + 30)

    // If more than 30 days have passed since membership start
    if (now > thirtyDaysAfterStart) {
      // Check if user has referrals
      const referralCount = await prisma.user.count({
        where: { sponsorId: user.id }
      })

      if (referralCount === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Your 30-day earning period has expired. You need at least 1 referral to continue earning tasks.' 
        }, { status: 403 })
      }

      // Check advanced referral rules for earning continuation
      const referrals = await prisma.user.findMany({
        where: { sponsorId: user.id },
        select: { membershipPlan: true }
      })

      let canContinue = false
      const userPlan = user.membershipPlan

      if (userPlan === 'BASIC') {
        // Basic users can continue with any referral type
        canContinue = referrals.length > 0
      } else if (userPlan === 'STANDARD') {
        // Standard users need Standard or Premium referrals
        canContinue = referrals.some(r => r.membershipPlan === 'STANDARD' || r.membershipPlan === 'PREMIUM')
      } else if (userPlan === 'PREMIUM') {
        // Premium users need Premium referrals
        canContinue = referrals.some(r => r.membershipPlan === 'PREMIUM')
      }

      if (!canContinue) {
        return NextResponse.json({ 
          success: false, 
          error: 'Your earning continuation requires specific referral types. Please check your referral requirements.' 
        }, { status: 403 })
      }
    }

    // Check if user already has tasks for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingTasks = await prisma.taskCompletion.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        task: true
      }
    })

    // If user already has 5 tasks for today, return existing tasks
    const tasksPerDay = 5 // Always 5 tasks per day
    if (existingTasks.length >= tasksPerDay) {
      const perTaskReward = Math.round(plan.dailyTaskEarning / tasksPerDay)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Daily tasks already assigned',
        tasks: existingTasks.map(tc => ({
          id: tc.task.id,
          completionId: tc.id,
          title: tc.task.title,
          description: tc.task.description,
          type: tc.task.type,
          reward: perTaskReward,
          status: tc.status,
          progress: tc.progress,
          completedAt: tc.completedAt,
          articleUrl: tc.task.articleUrl,
          minDuration: tc.task.minDuration,
          instructions: tc.task.instructions
        }))
      })
    }

    // Calculate per-task reward (Daily earning ÷ 5)
    const perTaskReward = Math.round(plan.dailyTaskEarning / tasksPerDay)

    // Get available active tasks
    const availableTasks = await prisma.task.findMany({
      where: {
        status: 'ACTIVE',
        type: {
          in: ['DAILY', 'SIMPLE', 'BASIC', 'CONTENT_ENGAGEMENT', 'VIDEO_WATCH']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: tasksPerDay
    })

    // If no tasks available, create default task templates
    if (availableTasks.length === 0) {
      const defaultTasks = [
        {
          title: 'Daily Check-in Task',
          description: 'Complete your daily check-in to earn rewards',
          type: 'DAILY',
          category: 'ENGAGEMENT',
          instructions: 'Click the Complete Task button to finish this daily check-in task.'
        },
        {
          title: 'Platform Engagement Task',
          description: 'Engage with the platform to earn rewards',
          type: 'SIMPLE',
          category: 'ENGAGEMENT', 
          instructions: 'Complete this simple engagement task by clicking the Complete button.'
        },
        {
          title: 'Community Activity Task',
          description: 'Participate in community activities',
          type: 'BASIC',
          category: 'COMMUNITY',
          instructions: 'Show your community spirit by completing this basic task.'
        },
        {
          title: 'Learning Task',
          description: 'Learn something new today',
          type: 'BASIC',
          category: 'EDUCATION',
          instructions: 'Expand your knowledge by completing this learning task.'
        },
        {
          title: 'Achievement Task',
          description: 'Unlock your daily achievement',
          type: 'DAILY',
          category: 'ACHIEVEMENT',
          instructions: 'Claim your daily achievement by completing this task.'
        }
      ]

      // Create default tasks
      for (const taskData of defaultTasks) {
        const task = await prisma.task.create({
          data: {
            ...taskData,
            difficulty: 'EASY',
            reward: perTaskReward,
            status: 'ACTIVE',
            icon: '⚡',
            color: '#10b981'
          }
        })
        availableTasks.push(task)
      }
    }

    // Assign 5 tasks to user
    const taskAssignments = []
    for (let i = 0; i < tasksPerDay; i++) {
      const task = availableTasks[i % availableTasks.length] // Cycle through available tasks
      
      const taskCompletion = await prisma.taskCompletion.create({
        data: {
          userId: user.id,
          taskId: task.id,
          status: 'PENDING',
          progress: 0,
          reward: perTaskReward
        }
      })

      taskAssignments.push({
        id: task.id,
        completionId: taskCompletion.id,
        title: task.title,
        description: task.description,
        type: task.type,
        reward: perTaskReward,
        status: 'PENDING',
        progress: 0,
        completedAt: null,
        articleUrl: task.articleUrl,
        minDuration: task.minDuration,
        instructions: task.instructions
      })
    }

    return NextResponse.json({
      success: true,
      message: `${tasksPerDay} daily tasks assigned successfully!`,
      tasks: taskAssignments,
      totalReward: perTaskReward * tasksPerDay,
      membershipPlan: plan.displayName,
      perTaskReward
    })

  } catch (error) {
    console.error('Error assigning daily tasks:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to assign daily tasks' 
    }, { status: 500 })
  }
}

// GET: Check daily task status
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession()
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        membershipPlan: true,
        membershipStatus: true,
        tasksEnabled: true,
        membershipStartDate: true
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    const plan = user.membershipPlan ? await prisma.membershipPlan.findUnique({
      where: { name: user.membershipPlan }
    }) : null

    // Get today's tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysTasks = await prisma.taskCompletion.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        task: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const tasksPerDay = 5
    const completedTasks = todaysTasks.filter(tc => tc.status === 'COMPLETED').length
    const pendingTasks = todaysTasks.filter(tc => tc.status === 'PENDING').length
    const perTaskReward = plan ? Math.round(plan.dailyTaskEarning / tasksPerDay) : 0

    // Calculate active days
    const membershipStart = user.membershipStartDate || new Date()
    const now = new Date()
    const activeDays = Math.floor((now.getTime() - membershipStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Check earning continuation
    let canEarn = true
    let earningMessage = ''

    if (user.membershipStatus !== 'ACTIVE') {
      canEarn = false
      earningMessage = 'Active membership required'
    } else if (!user.tasksEnabled) {
      canEarn = false
      earningMessage = 'Tasks disabled by admin'
    } else {
      const thirtyDaysAfterStart = new Date(membershipStart)
      thirtyDaysAfterStart.setDate(thirtyDaysAfterStart.getDate() + 30)
      
      if (now > thirtyDaysAfterStart) {
        const referralCount = await prisma.user.count({
          where: { sponsorId: user.id }
        })
        
        if (referralCount === 0) {
          canEarn = false
          earningMessage = '30-day period expired. Need ≥1 referral to continue.'
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: {
        canEarnToday: canEarn,
        hasTasksAssigned: todaysTasks.length > 0,
        completedTasks,
        pendingTasks,
        totalTasksToday: todaysTasks.length,
        dailyEarningAmount: plan?.dailyTaskEarning || 0,
        perTaskReward,
        membershipPlan: user.membershipPlan,
        membershipStatus: user.membershipStatus,
        activeDays,
        earningMessage
      },
      tasks: todaysTasks.map(tc => ({
        id: tc.task.id,
        completionId: tc.id,
        title: tc.task.title,
        description: tc.task.description,
        type: tc.task.type,
        reward: perTaskReward,
        status: tc.status,
        progress: tc.progress,
        completedAt: tc.completedAt,
        articleUrl: tc.task.articleUrl,
        minDuration: tc.task.minDuration,
        instructions: tc.task.instructions
      }))
    })

  } catch (error) {
    console.error('Error fetching daily task status:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch task status' 
    }, { status: 500 })
  }
}