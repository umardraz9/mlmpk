import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { validateTaskAccess } from '@/lib/task-country-middleware'

// Helper function to get global task amount setting from config
function getGlobalTaskAmount(): number | null {
  const globalAmount = process.env.GLOBAL_TASK_AMOUNT
  return globalAmount ? parseInt(globalAmount, 10) : null
}

// POST - Submit a task for completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check country restrictions first
    const countryBlockResponse = await validateTaskAccess(request)
    if (countryBlockResponse) {
      return countryBlockResponse
    }

    const session = await requireAuth()
    const { id } = await params;

    const { 
      proofText, 
      proofLinks, 
      proofFiles, 
      notes,
      metadata = {} 
    } = await request.json()

    console.log(`📝 Task submission for task ${id} by user ${session.user.id}`)

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task || task.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Task not found or inactive' }, { status: 404 })
    }

    // Check if user has started this task
    const existingCompletion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: id
        }
      }
    })

    if (!existingCompletion) {
      return NextResponse.json({ 
        error: 'Task not started. Please start the task first.' 
      }, { status: 400 })
    }

    if (existingCompletion.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Task already completed' 
      }, { status: 400 })
    }

    // If this is a content engagement task (has articleUrl or specific type), validate tracking data
    const isContentTask = !!(task as any).articleUrl || (task as any).type === 'CONTENT_ENGAGEMENT'
    if (isContentTask) {
      const t = task as any
      const minDuration = Number(t.minDuration || 45)
      const requireScrolling = t.requireScrolling ?? true
      const minScrollPercentage = Number(t.minScrollPercentage || 50)
      const requireMouseMovement = t.requireMouseMovement ?? true
      const minAdClicks = Number(t.minAdClicks || 0)

      const timeSpent = Number((metadata as any)?.timeSpent || 0)
      const scrollPercentage = Number((metadata as any)?.scrollPercentage || 0)
      const userInteractions = Number((metadata as any)?.userInteractions || 0)
      const adClicks = Number((metadata as any)?.adClicks || 0)

      const missing: string[] = []
      if (timeSpent < minDuration) {
        missing.push(`Spend at least ${minDuration} seconds reading`)
      }
      if (requireScrolling && scrollPercentage < minScrollPercentage) {
        missing.push(`Scroll to at least ${minScrollPercentage}% of the article`)
      }
      if (requireMouseMovement && userInteractions < 3) {
        missing.push('Show engagement with at least 3 interactions')
      }
      if (minAdClicks > 0 && adClicks < minAdClicks) {
        missing.push(`Click on at least ${minAdClicks} advertisement(s)`) 
      }

      if (missing.length > 0) {
        return NextResponse.json({ 
          error: 'Task requirements not met',
          missingRequirements: missing
        }, { status: 400 })
      }
    }

    // Prepare submission data
    const submissionData = {
      proofText: proofText || null,
      proofLinks: Array.isArray(proofLinks) ? proofLinks : [],
      proofFiles: Array.isArray(proofFiles) ? proofFiles : [],
      submittedAt: new Date().toISOString(),
      metadata: metadata
    }

    // Update task completion with submission
    const updatedCompletion = await prisma.taskCompletion.update({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: id
        }
      },
      data: {
        status: 'PENDING',
        progress: 100,
        notes: notes || null,
        trackingData: JSON.stringify(submissionData),
        completedAt: new Date()
      }
    })

    // Get user's membership plan for per-task reward calculation and earning eligibility
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        membershipPlan: true,
        membershipStatus: true,
        membershipStartDate: true,
        tasksEnabled: true,
        createdAt: true
      }
    })

    if (!user || user.membershipStatus !== 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Task completion not allowed - membership not active' 
      }, { status: 403 })
    }

    // Check if tasks are enabled for this user (admin control)
    if (!user.tasksEnabled) {
      return NextResponse.json({ 
        error: 'Tasks are disabled for your account. Please contact admin.' 
      }, { status: 403 })
    }

    // Check earning continuation (30 days without referrals, then requires ≥1 referral)
    const now = new Date()
    const membershipStart = user.membershipStartDate || user.createdAt
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
          error: 'Your 30-day earning period has expired. You need at least 1 referral to continue earning.' 
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
          error: 'Your earning continuation requires specific referral types. Please check your referral requirements.' 
        }, { status: 403 })
      }
    }

    // Get membership plan details for reward calculation
    let plan = null as any
    if (user.membershipPlan) {
      const normalized = (user.membershipPlan || '').toUpperCase()
      try {
        plan = await prisma.membershipPlan.findFirst({
          where: { OR: [{ name: normalized }, { name: user.membershipPlan }] }
        })
      } catch (e) {
        console.log('Database plan lookup failed')
      }
      // We purposely do NOT rely on defaults for reward math to avoid mismatches;
      // defaults may be used for UI copy elsewhere but reward falls back to constant 30.
    }

    // Calculate per-task reward consistently across APIs
    const globalTaskAmount = getGlobalTaskAmount()
    let perTaskReward: number
    if (globalTaskAmount && globalTaskAmount > 0) {
      perTaskReward = globalTaskAmount
    } else if (plan && (plan as any).id) {
      const dailyEarning = plan?.dailyTaskEarning ?? 0
      const tasksPerDay = plan?.tasksPerDay ?? 5
      perTaskReward = dailyEarning > 0 ? Math.round(dailyEarning / tasksPerDay) : 30
    } else {
      perTaskReward = 30
    }

    // For simple tasks (DAILY, SIMPLE, BASIC) and validated content tasks, auto-approve immediately
    if (['DAILY', 'SIMPLE', 'BASIC', 'CONTENT_ENGAGEMENT'].includes(task.type)) {
      await approveTaskCompletion(session.user.id, id, perTaskReward)
      
      return NextResponse.json({
        success: true,
        message: `Task completed successfully! PKR ${perTaskReward} has been added to your account.`,
        status: 'COMPLETED',
        rewardEarned: perTaskReward,
        autoApproved: true
      })
    }

    // For complex tasks, require manual approval
    // Create notification for admin
    await prisma.notification.create({
      data: {
        title: 'New Task Submission',
        message: `User has submitted task: ${task.title}`,
        type: 'info',
        category: 'task_submission',
        role: 'admin',
        data: JSON.stringify({
          taskId: id,
          userId: session.user.id,
          taskTitle: task.title,
          userName: session.user.name || session.user.email
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Task submitted successfully! Your submission is being reviewed.',
      status: 'PENDING',
      requiresApproval: true
    })

  } catch (error) {
    console.error('Error submitting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to approve task and award reward
async function approveTaskCompletion(userId: string, taskId: string, reward: number) {
  try {
    await prisma.$transaction(async (tx) => {
      // Update task completion status
      await tx.taskCompletion.update({
        where: {
          userId_taskId: { userId, taskId }
        },
        data: {
          status: 'COMPLETED',
          reward: reward
        }
      })

      // Get user details for referral commission processing
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          sponsorId: true,
          membershipPlan: true,
          balance: true,
          totalEarnings: true,
          availableVoucherPkr: true
        }
      })

      // Update user balance and stats
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: reward },
          totalPoints: { increment: Math.floor(reward) },
          tasksCompleted: { increment: 1 },
          totalEarnings: { increment: reward }
        }
      })

      // Update task completion count
      await tx.task.update({
        where: { id: taskId },
        data: {
          completions: { increment: 1 }
        }
      })

      // Create transaction record for main task reward
      await tx.transaction.create({
        data: {
          userId: userId,
          type: 'TASK_REWARD',
          amount: reward,
          description: `Task completion reward`,
          status: 'COMPLETED'
        }
      })

      // Process referral commissions if user has a sponsor
      if (user?.sponsorId && user?.membershipPlan) {
        await processReferralCommissions(tx, userId, user.sponsorId, user.membershipPlan, reward)
      }

      // Create success notification
      await tx.notification.create({
        data: {
          title: 'Task Completed!',
          message: `You earned PKR ${reward} for completing a task.`,
          type: 'success',
          recipientId: userId
        }
      })
    })

    console.log(`✅ Task ${taskId} approved for user ${userId}, reward: PKR ${reward}`)
  } catch (error) {
    console.error('Error approving task completion:', error)
    throw error
  }
}

// Helper function to process referral commissions
async function processReferralCommissions(tx: any, referredUserId: string, sponsorId: string, membershipPlan: string, taskReward: number) {
  try {
    // Define commission rates for different levels (5 levels up the chain)
    const commissionRates = [0.10, 0.05, 0.03, 0.02, 0.01] // 10%, 5%, 3%, 2%, 1%

    let currentSponsorId = sponsorId
    let level = 1

    // Process up to 5 levels of referral commissions
    for (const rate of commissionRates) {
      if (!currentSponsorId || level > 5) break

      // Get sponsor details
      const sponsor = await tx.user.findUnique({
        where: { id: currentSponsorId },
        select: {
          id: true,
          sponsorId: true,
          membershipStatus: true,
          membershipPlan: true,
          balance: true,
          availableVoucherPkr: true,
          totalEarnings: true
        }
      })

      if (!sponsor || sponsor.membershipStatus !== 'ACTIVE') {
        // Move to next level if sponsor is inactive
        currentSponsorId = sponsor?.sponsorId || null
        level++
        continue
      }

      // Calculate commission amount
      const commissionAmount = Math.round(taskReward * rate)

      if (commissionAmount > 0) {
        // Update sponsor's balances
        await tx.user.update({
          where: { id: currentSponsorId },
          data: {
            balance: { increment: commissionAmount },
            availableVoucherPkr: { increment: commissionAmount },
            totalEarnings: { increment: commissionAmount }
          }
        })

        // Create commission transaction record
        await tx.transaction.create({
          data: {
            userId: currentSponsorId,
            type: 'REFERRAL_COMMISSION',
            amount: commissionAmount,
            description: `Level ${level} referral commission from task completion`,
            status: 'COMPLETED',
            metadata: JSON.stringify({
              referredUserId,
              level,
              originalTaskReward: taskReward,
              commissionRate: rate
            })
          }
        })

        // Create ReferralCommissionEarning record
        await tx.referralCommissionEarning.create({
          data: {
            userId: currentSponsorId,
            referredUserId,
            membershipPlan,
            level,
            amount: commissionAmount,
            earningDate: new Date()
          }
        })

        // Create notification for sponsor
        await tx.notification.create({
          data: {
            title: 'Referral Commission Earned!',
            message: `You earned PKR ${commissionAmount} commission from your Level ${level} referral's task completion.`,
            type: 'success',
            recipientId: currentSponsorId
          }
        })

        console.log(`💰 Level ${level} commission: PKR ${commissionAmount} to sponsor ${currentSponsorId}`)
      }

      // Move to next level
      currentSponsorId = sponsor.sponsorId
      level++
    }
  } catch (error) {
    console.error('Error processing referral commissions:', error)
    // Don't throw error to avoid breaking main task completion
  }
}