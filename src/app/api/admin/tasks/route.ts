import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db';
import { requireAdmin, getServerSession } from '@/lib/session'
// import { broadcastTaskUpdate } from '@/app/api/tasks/events/route'

// GET - List tasks with search and filters
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const difficulty = searchParams.get('difficulty') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      // Only show active tasks by default (not deleted/archived)
      status: status || 'ACTIVE'
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } }
      ]
    }
    
    if (type) where.type = type
    if (category) where.category = category
    if (difficulty) where.difficulty = difficulty
    
    // Allow admin to see all statuses if explicitly requested
    if (status) where.status = status

    // Get tasks with pagination (optimized)
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          category: true,
          difficulty: true,
          reward: true,
          status: true,
          target: true,
          timeLimit: true,
          startDate: true,
          endDate: true,
          instructions: true,
          icon: true,
          color: true,
          completions: true,
          attempts: true,
          createdAt: true
        }
      }),
      prisma.task.count({ where })
    ])

    // Get analytics separately and cache it
    const analytics = await getTaskAnalytics()

    // Enrich tasks with completion stats
    const enrichedTasks = tasks.map(task => ({
      ...task,
      totalCompletions: task.completions,
      pendingCompletions: 0, // Simplified for performance
      successfulCompletions: task.completions,
      completionRate: task.attempts > 0 ? (task.completions / task.attempts) * 100 : 0,
      recentCompletions: [] // Simplified for performance
    }))

    return NextResponse.json({
      tasks: enrichedTasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      analytics
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    if ((error as any)?.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new task
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Admin task creation started')
    const session = await requireAdmin()

    console.log('✅ Admin authenticated:', session.user.email)

    const data = await request.json()
    console.log('📝 Received task data:', JSON.stringify(data, null, 2))

    const {
      title,
      description,
      type,
      category,
      difficulty,
      reward,
      target,
      timeLimit,
      startDate,
      endDate,
      instructions,
      icon,
      color,
      // Article reading task fields
      articleUrl,
      minDuration,
      minScrollPercentage,
      maxAttempts,
      minAdClicks,
      requireScrolling,
      requireMouseMovement
    } = data

    // Enhanced validation with detailed logging
    const validationErrors = []
    
    if (!title || title.trim() === '') {
      validationErrors.push('Title is required and cannot be empty')
    }
    
    if (!type || type.trim() === '') {
      validationErrors.push('Type is required and cannot be empty')
    }

    // Additional validation for article reading and video watching tasks
    if ((type === 'CONTENT_ENGAGEMENT' || type === 'VIDEO_WATCH') && (!articleUrl || articleUrl.trim() === '')) {
      validationErrors.push(`${type === 'CONTENT_ENGAGEMENT' ? 'Article' : 'Video'} URL is required for ${type === 'CONTENT_ENGAGEMENT' ? 'article reading' : 'video watching'} tasks`)
    }

    if (reward && (isNaN(parseFloat(reward)) || parseFloat(reward) < 0)) {
      validationErrors.push('Reward must be a valid positive number')
    }

    if (validationErrors.length > 0) {
      console.error('❌ Validation errors:', validationErrors)
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    console.log('✅ Validation passed, creating task...')

    // Prepare task data with proper type conversion and defaults
    const taskData = {
      title: title.trim(),
      description: description?.trim() || `Complete the ${type.toLowerCase()} task`,
      type,
      category: category || 'content',
      difficulty: difficulty || 'MEDIUM',
      reward: reward ? parseFloat(reward) : 10,
      target: target ? parseInt(target) : 1,
      timeLimit: timeLimit ? parseInt(timeLimit) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      instructions: instructions?.trim() || null,
      icon: icon || '📖',
      color: color || '#059669',
      status: 'ACTIVE',
      completions: 0,
      attempts: 0,
      // Article reading task fields
      articleUrl: articleUrl?.trim() || null,
      minDuration: minDuration ? parseInt(minDuration) : null,
      requireScrolling: requireScrolling !== undefined ? requireScrolling : (minScrollPercentage > 0),
      requireMouseMovement: requireMouseMovement !== undefined ? requireMouseMovement : true,
      minScrollPercentage: minScrollPercentage ? parseInt(minScrollPercentage) : null,
      maxAttempts: maxAttempts ? parseInt(maxAttempts) : 3,
      minAdClicks: minAdClicks ? parseInt(minAdClicks) : 0
    }

    console.log('📊 Final task data for database:', JSON.stringify(taskData, null, 2))

    const task = await prisma.task.create({
      data: taskData
    })

    console.log('✅ Task created successfully:', task.id, '-', task.title)

    // Broadcast task creation to all connected clients
    // broadcastTaskUpdate('task_created', task)

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task: task
    })
  } catch (error) {
    console.error('❌ Error creating task:', error)
    console.error('Stack trace:', error.stack)
    
    // More specific error handling
    if ((error as any)?.message === 'Admin access required') {
      return NextResponse.json({ 
        error: 'Unauthorized: Admin access required',
        code: 'UNAUTHORIZED'
      }, { status: 401 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A task with this title already exists',
        code: 'DUPLICATE_TITLE'
      }, { status: 400 })
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Referenced record not found',
        code: 'INVALID_REFERENCE'
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}

// Helper function to get task analytics
async function getTaskAnalytics() {
  const [
    totalTasks,
    activeTasks,
    completedTasks,
    totalCompletions,
    activeUsers,
    categoryStats,
    difficultyStats,
    typeStats,
    recentCompletions
  ] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: 'ACTIVE' } }),
    prisma.taskCompletion.count({ where: { status: 'COMPLETED' } }),
    prisma.taskCompletion.count(),
    prisma.taskCompletion.groupBy({
      by: ['userId'],
      _count: { id: true }
    }).then(results => results.length),
    prisma.task.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    }),
    prisma.task.groupBy({
      by: ['difficulty'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    }),
    prisma.task.groupBy({
      by: ['type'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    }),
    prisma.taskCompletion.findMany({
      where: { status: 'COMPLETED' },
      take: 10,
      orderBy: { completedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            category: true,
            reward: true
          }
        }
      }
    })
  ])

  return {
    totalTasks,
    activeTasks,
    completedTasks,
    totalCompletions,
    activeUsers,
    completionRate: totalCompletions > 0 ? (completedTasks / totalCompletions) * 100 : 0,
    categoryStats,
    difficultyStats,
    typeStats,
    recentCompletions
  }
} 