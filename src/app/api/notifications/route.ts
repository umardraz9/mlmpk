import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// Demo notifications
const demoNotifications = [
  {
    id: '1',
    title: 'Welcome to Social!',
    message: 'Start connecting with people',
    type: 'info',
    priority: 'normal',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'New Friend Request',
    message: 'Ahmed Khan sent you a friend request',
    type: 'friend_request',
    priority: 'high',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Post Liked',
    message: 'Fatima Ali liked your post',
    type: 'like',
    priority: 'normal',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  }
];

// GET - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || 'all'
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const skip = (page - 1) * limit

    // Filter demo notifications
    let filtered = demoNotifications;
    
    if (type !== 'all') {
      filtered = filtered.filter(n => n.type === type);
    }
    
    if (unreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }

    // Paginate
    const total = filtered.length;
    const notifications = filtered.slice(skip, skip + limit);
    const unreadCount = demoNotifications.filter(n => !n.isRead).length;

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
    const session = await getSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message } = body

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json({ 
        error: 'Title and message are required' 
      }, { status: 400 })
    }

    // Demo: Return success
    const notification = {
      id: Date.now().toString(),
      title,
      message,
      type: body.type || 'info',
      isRead: false,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update notifications (bulk mark as read, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'markAsRead' || action === 'markAllAsRead') {
      // Demo: Return success
      return NextResponse.json({ 
        message: 'Notifications marked as read',
        count: 2
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 