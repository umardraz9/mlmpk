import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Helper function to require admin access
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Not authenticated')
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true }
  })
  
  if (!user?.isAdmin) {
    throw new Error('Admin access required')
  }
  
  return session
}

// POST - Approve/reject task submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params;
    const { action, notes } = await request.json()

    console.log(`🔍 Admin ${action} task submission ${id}`)

    // Get the task completion
    const taskCompletion = await prisma.taskCompletion.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { title: true, reward: true, type: true } }
      }
    })

    if (!taskCompletion) {
      return NextResponse.json({ error: 'Task completion not found' }, { status: 404 })
    }

    if (taskCompletion.status !== 'PENDING') {
      return NextResponse.json({ error: 'Task is not pending approval' }, { status: 400 })
    }

    if (action === 'approve') {
      // Approve and award reward
      await prisma.$transaction(async (tx) => {
        // Update completion status
        await tx.taskCompletion.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            reward: taskCompletion.task.reward,
            notes: notes ? `Admin approved: ${notes}` : 'Admin approved'
          }
        })

        // Update user balance and stats
        await tx.user.update({
          where: { id: taskCompletion.userId },
          data: {
            balance: { increment: taskCompletion.task.reward },
            totalPoints: { increment: Math.floor(taskCompletion.task.reward) },
            tasksCompleted: { increment: 1 }
          }
        })

        // Update task completion count
        await tx.task.update({
          where: { id: taskCompletion.taskId },
          data: {
            completions: { increment: 1 }
          }
        })

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: taskCompletion.userId,
            type: 'TASK_REWARD',
            amount: taskCompletion.task.reward,
            description: `Task approved: ${taskCompletion.task.title}`,
            status: 'COMPLETED'
          }
        })

        // Create success notification
        await tx.notification.create({
          data: {
            title: 'Task Approved!',
            message: `Your task \"${taskCompletion.task.title}\" has been approved. PKR ${taskCompletion.task.reward} added to your account.`,
            type: 'success',
            recipientId: taskCompletion.userId
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Task approved successfully',
        reward: taskCompletion.task.reward
      })

    } else if (action === 'reject') {
      // Reject submission
      await prisma.$transaction(async (tx) => {
        // Update completion status
        await tx.taskCompletion.update({
          where: { id },
          data: {
            status: 'REJECTED',
            notes: notes ? `Admin rejected: ${notes}` : 'Admin rejected'
          }
        })

        // Create rejection notification
        await tx.notification.create({
          data: {
            title: 'Task Rejected',
            message: `Your task \"${taskCompletion.task.title}\" was rejected. ${notes ? `Reason: ${notes}` : ''}`,
            type: 'warning',
            recipientId: taskCompletion.userId
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Task rejected successfully'
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing task approval:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}