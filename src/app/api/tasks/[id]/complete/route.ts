import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/session'

// Helper function to get global task amount setting from config
function getGlobalTaskAmount(): number | null {
  const globalAmount = process.env.GLOBAL_TASK_AMOUNT
  return globalAmount ? parseInt(globalAmount, 10) : null
}

// POST - Complete a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { progress = 100, notes, trackingData, articleUrl } = await request.json()

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task || task.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Task not found or inactive' }, { status: 404 })
    }

    // Get existing task completion
    const existingCompletion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: id
        }
      }
    })

    if (!existingCompletion) {
      return NextResponse.json({ error: 'Task not started' }, { status: 400 })
    }

    if (existingCompletion.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 })
    }

    // Validate tracking data for article tasks
    if (trackingData && articleUrl) {
      // Validate minimum time spent
      const minDuration = (task as any).minDuration || 45
      if (trackingData.timeSpent < minDuration) {
        return NextResponse.json({ 
          error: `Minimum time requirement not met. Required: ${minDuration}s, Actual: ${trackingData.timeSpent}s` 
        }, { status: 400 })
      }

      // Validate scrolling requirement
      const requireScrolling = (task as any).requireScrolling ?? true
      const minScrollPercentage = (task as any).minScrollPercentage || 50
      if (requireScrolling && trackingData.scrollPercentage < minScrollPercentage) {
        return NextResponse.json({ 
          error: `Scrolling requirement not met. Required: ${minScrollPercentage}%, Actual: ${trackingData.scrollPercentage.toFixed(1)}%` 
        }, { status: 400 })
      }

      // Validate mouse movement requirement
      const requireMouseMovement = (task as any).requireMouseMovement ?? true
      if (requireMouseMovement && trackingData.mouseMovements < 10) {
        return NextResponse.json({ 
          error: `Interaction requirement not met. Required: 10+ movements, Actual: ${trackingData.mouseMovements}` 
        }, { status: 400 })
      }

      // Check for suspicious behavior (too fast completion, no real interaction)
      if (trackingData.timeSpent < 30 || trackingData.mouseMovements < 5) {
        return NextResponse.json({ 
          error: 'Suspicious activity detected. Please engage naturally with the content.' 
        }, { status: 400 })
      }

      // Validate ad clicks if required
      const minAdClicks = Number((task as any).minAdClicks || 0)
      if (minAdClicks > 0) {
        const adClicks = Number((trackingData as any)?.adClicks || 0)
        if (adClicks < minAdClicks) {
          return NextResponse.json({
            error: `Ad click requirement not met. Required: ${minAdClicks}, Actual: ${adClicks}`
          }, { status: 400 })
        }
      }
    }

    // Determine completion status
    const isCompleted = progress >= task.target
    const status = isCompleted ? 'COMPLETED' : 'IN_PROGRESS'
    // Compute reward from user's membership plan (daily ÷ tasksPerDay)
    let reward = 0
    if (isCompleted) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { membershipPlan: true }
      })
      let plan = null as any
      if (user?.membershipPlan) {
        const normalized = (user.membershipPlan || '').toUpperCase()
        try {
          plan = await prisma.membershipPlan.findFirst({
            where: {
              OR: [
                { name: normalized },
                { name: user.membershipPlan }
              ]
            }
          })
        } catch (e) {
          // ignore; we'll fall back below
        }
      }
      // Calculate per-task reward with consistent rules across APIs
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
      reward = perTaskReward
    }

    // Update task completion
    const updatedCompletion = await prisma.taskCompletion.update({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: id
        }
      },
      data: {
        status,
        progress: Math.min(progress, task.target),
        reward,
        notes: notes || existingCompletion.notes,
        completedAt: isCompleted ? new Date() : null,
        // Store tracking data in notes field as JSON
        ...(trackingData && { 
          notes: JSON.stringify({
            originalNotes: notes || existingCompletion.notes,
            trackingData,
            articleUrl,
            validatedAt: new Date().toISOString()
          })
        })
      }
    })

    // If completed, update user stats and reward
    if (isCompleted) {
      await Promise.all([
        // Update user points and task completion count
        prisma.user.update({
          where: { id: session.user.id },
          data: {
            totalPoints: {
              increment: Math.floor(reward)
            },
            tasksCompleted: {
              increment: 1
            },
            balance: {
              increment: reward
            }
          }
        }),
        // Update task completion count
        prisma.task.update({
          where: { id },
          data: {
            completions: {
              increment: 1
            }
          }
        })
      ])

      // Award commission to sponsor if applicable
      await awardTaskCommission(session.user.id, reward)
    }

    return NextResponse.json({
      ...updatedCompletion,
      isCompleted,
      rewardEarned: reward
    })
  } catch (error) {
    console.error('Error completing task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update task progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { progress, notes } = await request.json()

    if (progress === undefined || progress < 0) {
      return NextResponse.json({ error: 'Valid progress is required' }, { status: 400 })
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task || task.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Task not found or inactive' }, { status: 404 })
    }

    // Get existing task completion
    const existingCompletion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: id
        }
      }
    })

    if (!existingCompletion) {
      return NextResponse.json({ error: 'Task not started' }, { status: 400 })
    }

    if (existingCompletion.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 })
    }

    // Update progress
    const updatedCompletion = await prisma.taskCompletion.update({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: id
        }
      },
      data: {
        progress: Math.min(progress, task.target),
        notes: notes || existingCompletion.notes,
        status: progress >= task.target ? 'COMPLETED' : 'IN_PROGRESS'
      }
    })

    return NextResponse.json(updatedCompletion)
  } catch (error) {
    console.error('Error updating task progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to award commission to sponsor
async function awardTaskCommission(userId: string, amount: number) {
  try {
    // Get user's sponsor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sponsorId: true }
    })

    if (!user?.sponsorId) {
      return // No sponsor to award commission to
    }

    // Award 10% commission to sponsor
    const commissionAmount = amount * 0.1

    await prisma.user.update({
      where: { id: user.sponsorId },
      data: {
        pendingCommission: {
          increment: commissionAmount
        }
      }
    })

    console.log(`Task commission awarded: ${commissionAmount} to sponsor ${user.sponsorId}`)
  } catch (error) {
    console.error('Error awarding task commission:', error)
  }
} 