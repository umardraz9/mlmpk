import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST - Reset task state for stuck tasks
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Find existing task completion
    const existingCompletion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: taskId
        }
      }
    })

    if (existingCompletion) {
      // Reset the task completion state
      await prisma.taskCompletion.update({
        where: {
          userId_taskId: {
            userId: session.user.id,
            taskId: taskId
          }
        },
        data: {
          status: 'PENDING',
          progress: 0,
          startedAt: null,
          completedAt: null,
          data: null
        }
      })

      console.log(`Task ${taskId} reset for user ${session.user.id}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Task state reset successfully'
    })
  } catch (error) {
    console.error('Error resetting task state:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
