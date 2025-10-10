import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || 'all'
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const skip = (page - 1) * limit

    // Build filters
    const where: any = {
      AND: [
        {
          OR: [
            { recipientId: session.user.id },
            { 
              isGlobal: true,
              OR: [
                { role: null },
                { role: session.user.role },
              ]
            }
          ]
        },
        {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      ]
    }

    if (type !== 'all') {
      where.type = type
    }

    if (unreadOnly) {
      where.isRead = false
    }

    // Get notifications with pagination
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false
        }
      })
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      message,
      type = 'info',
      category,
      priority = 'normal',
      recipientId,
      role,
      audience,
      data,
      actionUrl,
      actionText,
      imageUrl,
      scheduledFor,
      expiresAt,
      isGlobal = false
    } = body

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Title and message are required' 
      }, { status: 400 })
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        category,
        priority,
        recipientId,
        role,
        audience,
        data: data ? JSON.stringify(data) : null,
        actionUrl,
        actionText,
        imageUrl,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isGlobal,
        createdById: session.user.id
      },
      include: {
        recipient: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // TODO: Trigger real-time notification delivery here
    // await deliverNotificationRealtime(notification)

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update notifications (bulk mark as read, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationIds } = body

    if (action === 'markAsRead') {
      const where: any = {
        recipientId: session.user.id,
        isRead: false
      }

      if (notificationIds && Array.isArray(notificationIds)) {
        where.id = { in: notificationIds }
      }

      const result = await prisma.notification.updateMany({
        where,
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'Notifications marked as read',
        count: result.count
      })
    }

    if (action === 'markAllAsRead') {
      const result = await prisma.notification.updateMany({
        where: {
          OR: [
            { recipientId: session.user.id },
            { 
              isGlobal: true,
              OR: [
                { role: null },
                { role: session.user.role }
              ]
            }
          ],
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return NextResponse.json({ 
        message: 'All notifications marked as read',
        count: result.count
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 