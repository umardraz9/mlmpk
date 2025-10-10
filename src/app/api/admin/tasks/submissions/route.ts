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

// GET - Get task submissions for admin review
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    console.log(`📋 Admin fetching task submissions: status=${status}, page=${page}`)

    // Get task submissions
    const submissions = await prisma.taskCompletion.findMany({
      where: {
        status: status === 'ALL' ? undefined : status
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            reward: true,
            difficulty: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const total = await prisma.taskCompletion.count({
      where: {
        status: status === 'ALL' ? undefined : status
      }
    })

    // Process submissions to add parsed tracking data
    const processedSubmissions = submissions.map(submission => {
      let trackingData = null
      try {
        trackingData = submission.trackingData ? JSON.parse(submission.trackingData) : null
      } catch (e) {
        // Ignore parsing errors
      }

      return {
        ...submission,
        trackingData,
        submittedAt: submission.completedAt,
        timeAgo: getTimeAgo(submission.createdAt)
      }
    })

    return NextResponse.json({
      success: true,
      submissions: processedSubmissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        pending: await prisma.taskCompletion.count({ where: { status: 'PENDING' } }),
        completed: await prisma.taskCompletion.count({ where: { status: 'COMPLETED' } }),
        rejected: await prisma.taskCompletion.count({ where: { status: 'REJECTED' } }),
        inProgress: await prisma.taskCompletion.count({ where: { status: 'IN_PROGRESS' } })
      }
    })

  } catch (error) {
    console.error('Error fetching task submissions:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}