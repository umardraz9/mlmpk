import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get message notifications for current user
    const messageNotifications = await prisma.notification.findMany({
      where: {
        recipientId: session.user.id,
        type: 'message',
        isActive: true
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
        createdAt: true,
        data: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Count unread message notifications
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: session.user.id,
        type: 'message',
        isRead: false,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      messages: messageNotifications.map(notif => ({
        id: notif.id,
        title: notif.title,
        content: notif.message,
        sender: notif.createdBy?.name || 'Unknown',
        senderAvatar: notif.createdBy?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        timestamp: notif.createdAt,
        isRead: notif.isRead,
        data: notif.data,
        timeAgo: getTimeAgo(notif.createdAt)
      })),
      unreadCount,
      totalCount: messageNotifications.length
    });

  } catch (error) {
    console.error('Error fetching message notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
