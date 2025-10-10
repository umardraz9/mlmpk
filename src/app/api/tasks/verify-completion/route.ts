import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { TaskVerificationService } from '@/lib/task-verification'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, taskId, verificationToken, verificationData } = await request.json()

    // Validate verification token
    const tokenValidation = TaskVerificationService.validateVerificationToken(verificationToken)
    if (!tokenValidation.valid || tokenValidation.userId !== userId || tokenValidation.taskId !== taskId) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 })
    }

    // Verify task completion
    const verification = TaskVerificationService.verifyTaskCompletion(verificationData)
    
    if (!verification.success) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient engagement detected',
        reasons: verification.reasons
      }, { status: 400 })
    }

    // Check if task exists and is in progress
    const taskCompletion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: taskId
        }
      },
      include: {
        task: true
      }
    })

    if (!taskCompletion || taskCompletion.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Task not found or not in progress' }, { status: 404 })
    }

    // Load user with membership and plan to enforce eligibility and limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        membershipPlan: true,
        membershipStatus: true,
        earningsContinueUntil: true,
        tasksEnabled: true,
        taskEarnings: true,
        totalEarnings: true,
        balance: true,
        dailyTasksCompleted: true
      }
    })

    if (!user || user.membershipStatus !== 'ACTIVE' || !user.tasksEnabled || !user.earningsContinueUntil || new Date() > user.earningsContinueUntil) {
      return NextResponse.json({ error: 'Task access disabled or earning period expired' }, { status: 403 })
    }

    const plan = user.membershipPlan ? await prisma.membershipPlan.findUnique({ where: { name: user.membershipPlan } }) : null
    const tasksPerDay = plan?.tasksPerDay ?? 5

    // Check for daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const completionsToday = await prisma.taskCompletion.count({
      where: {
        userId: session.user.id,
        completedAt: { gte: today }
      }
    })
    if (completionsToday >= tasksPerDay) {
      return NextResponse.json({ error: `Daily task limit reached (${tasksPerDay})` }, { status: 400 })
    }

    // Complete the task
    const completedTask = await prisma.taskCompletion.update({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: taskId
        }
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progress: 100
      }
    })

    // Compute per-task reward from membership plan (fallback to task reward)
    const rewardAmount = plan ? (plan.dailyTaskEarning / (plan.tasksPerDay || 5)) : taskCompletion.task.reward

    // Update user earnings and balance
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        taskEarnings: { increment: rewardAmount },
        totalEarnings: { increment: rewardAmount },
        balance: { increment: rewardAmount },
        tasksCompleted: { increment: 1 },
        dailyTasksCompleted: { increment: 1 },
        lastTaskCompletionDate: new Date()
      }
    })

    // Record transaction
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'TASK_EARNING',
        amount: rewardAmount,
        description: `Task earning from ${taskCompletion.task.title}`,
        status: 'COMPLETED',
        reference: completedTask.id
      }
    })

    // Create notification for task completion
    await prisma.notification.create({
      data: {
        title: 'Task Completed!',
        message: `You earned ${rewardAmount} points for completing: ${taskCompletion.task.title}`,
        type: 'success',
        recipientId: session.user.id,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      rewardEarned: rewardAmount,
      newBalance: updatedUser.balance,
      newTotalPoints: updatedUser.totalPoints
    })

  } catch (error) {
    console.error('Task verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
