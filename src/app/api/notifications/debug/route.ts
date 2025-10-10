import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true }
    });

    // Get all notifications for current user
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: session.user.id
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        category: true,
        isRead: true,
        isActive: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get all direct messages for current user
    const messages = await prisma.directMessage.findMany({
      where: {
        recipientId: session.user.id
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        content: true,
        type: true,
        status: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      debug: {
        currentUser,
        notificationCount: notifications.length,
        messageCount: messages.length,
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          isActive: n.isActive,
          createdAt: n.createdAt,
          sender: n.createdBy?.name || 'Unknown'
        })),
        messages: messages.map(m => ({
          id: m.id,
          content: m.content,
          status: m.status,
          createdAt: m.createdAt,
          sender: m.sender?.name || 'Unknown'
        }))
      }
    });

  } catch (error) {
    console.error('Debug notifications error:', error);
    return NextResponse.json({
      error: 'Failed to debug notifications',
      details: error.message
    }, { status: 500 });
  }
}
