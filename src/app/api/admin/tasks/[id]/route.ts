import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// GET - Get task details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { id } = params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        taskCompletions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                avatar: true,
                totalPoints: true,
                tasksCompleted: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Calculate detailed analytics
    const analytics = {
      totalCompletions: task.taskCompletions.length,
      pendingCompletions: task.taskCompletions.filter(tc => tc.status === 'PENDING').length,
      inProgressCompletions: task.taskCompletions.filter(tc => tc.status === 'IN_PROGRESS').length,
      successfulCompletions: task.taskCompletions.filter(tc => tc.status === 'COMPLETED').length,
      failedCompletions: task.taskCompletions.filter(tc => tc.status === 'FAILED').length,
      completionRate: task.attempts > 0 ? (task.completions / task.attempts) * 100 : 0,
      averageProgress: task.taskCompletions.length > 0 
        ? task.taskCompletions.reduce((sum, tc) => sum + tc.progress, 0) / task.taskCompletions.length 
        : 0,
      totalRewardsPaid: task.taskCompletions
        .filter(tc => tc.status === 'COMPLETED')
        .reduce((sum, tc) => sum + tc.reward, 0)
    }

    return NextResponse.json({
      ...task,
      analytics
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    if ((error as any)?.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { id } = params;

    const data = await request.json()
    const {
      title,
      description,
      type,
      category,
      difficulty,
      reward,
      status,
      target,
      timeLimit,
      startDate,
      endDate,
      instructions,
      icon,
      color,
      // Article fields
      articleUrl,
      minDuration,
      requireScrolling,
      requireMouseMovement,
      minScrollPercentage,
      maxAttempts,
      minAdClicks
    } = data

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(category && { category }),
        ...(difficulty && { difficulty }),
        ...(reward !== undefined && { reward: parseFloat(reward) }),
        ...(status && { status }),
        ...(target !== undefined && { target: parseInt(target) }),
        ...(timeLimit !== undefined && { timeLimit: timeLimit ? parseInt(timeLimit) : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(instructions !== undefined && { instructions }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        // Article fields
        ...(articleUrl !== undefined && { articleUrl: articleUrl || null }),
        ...(minDuration !== undefined && { minDuration: minDuration ? parseInt(minDuration) : null }),
        ...(requireScrolling !== undefined && { requireScrolling }),
        ...(requireMouseMovement !== undefined && { requireMouseMovement }),
        ...(minScrollPercentage !== undefined && { minScrollPercentage: minScrollPercentage ? parseInt(minScrollPercentage) : null }),
        ...(maxAttempts !== undefined && { maxAttempts: maxAttempts ? parseInt(maxAttempts) : null }),
        ...(minAdClicks !== undefined && { minAdClicks: minAdClicks ? parseInt(minAdClicks) : 0 })
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    if ((error as any)?.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { id } = params;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        taskCompletions: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if there are any completions
    if (existingTask.taskCompletions.length > 0) {
      // Instead of deleting, mark as archived
      const updatedTask = await prisma.task.update({
        where: { id },
        data: { status: 'ARCHIVED' }
      })
      
      return NextResponse.json({ 
        message: 'Task archived instead of deleted due to existing completions',
        task: updatedTask 
      })
    }

    // Delete task if no completions exist
    await prisma.task.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    if ((error as any)?.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}