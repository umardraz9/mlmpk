import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { TaskVerificationService } from '@/lib/task-verification'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const token = searchParams.get('token')

    if (!taskId || !token) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Validate token
    const tokenData = JSON.parse(atob(token))
    if (tokenData.userId !== session.user.id || tokenData.taskId !== taskId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Check if task exists and is active
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task || task.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user can start this task
    const existingCompletion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: taskId
        }
      }
    })

    if (existingCompletion && existingCompletion.status !== 'FAILED') {
      return NextResponse.json({ error: 'Task already started or completed' }, { status: 400 })
    }

    // Start the task
    await prisma.taskCompletion.upsert({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId: taskId
        }
      },
      update: {
        status: 'IN_PROGRESS',
        startedAt: new Date()
      },
      create: {
        userId: session.user.id,
        taskId: taskId,
        status: 'IN_PROGRESS'
      }
    })

    // Generate verification token for content site
    const verificationToken = TaskVerificationService.generateVerificationToken(
      session.user.id,
      taskId
    )

    // Redirect to content site
    const contentSiteUrl = process.env.CONTENT_SITE_URL || 'http://localhost:3002'
    const redirectUrl = `${contentSiteUrl}?userId=${session.user.id}&taskId=${taskId}&token=${verificationToken}&returnUrl=${encodeURIComponent('/tasks')}`

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Content redirect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
