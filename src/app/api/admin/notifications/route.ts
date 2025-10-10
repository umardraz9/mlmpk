import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get all notifications (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') || 'all'
    const status = searchParams.get('status') || 'all'
    const skip = (page - 1) * limit

    // Build filters
    const where: any = {}
    
    if (type !== 'all') {
      where.type = type
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    } else if (status === 'delivered') {
      where.isDelivered = true
    } else if (status === 'pending') {
      where.isDelivered = false
    } else if (status === 'scheduled') {
      where.scheduledFor = { gt: new Date() }
    } else if (status === 'expired') {
      where.expiresAt = { lt: new Date() }
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.notification.count({ where })
    ])

    // Get summary stats
    const stats = await prisma.notification.groupBy({
      by: ['type', 'isActive', 'isDelivered'],
      _count: true
    })

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats
    })
  } catch (error) {
    console.error('Error fetching admin notifications:', error)
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

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Bulk update notifications (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationIds, updateData } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    let result
    const where = notificationIds ? { id: { in: notificationIds } } : {}

    switch (action) {
      case 'activate':
        result = await prisma.notification.updateMany({
          where,
          data: { isActive: true }
        })
        break

      case 'deactivate':
        result = await prisma.notification.updateMany({
          where,
          data: { isActive: false }
        })
        break

      case 'delete':
        result = await prisma.notification.deleteMany({ where })
        break

      case 'update':
        if (!updateData) {
          return NextResponse.json({ error: 'Update data is required' }, { status: 400 })
        }
        result = await prisma.notification.updateMany({
          where,
          data: updateData
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: `Action '${action}' completed successfully`,
      count: result.count
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 