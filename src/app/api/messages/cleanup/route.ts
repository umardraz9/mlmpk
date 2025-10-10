import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Calculate 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Delete old messages
    const deletedMessages = await prisma.directMessage.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    // Delete old message notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        type: 'message',
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    console.log('🧹 Auto-cleanup completed:', {
      deletedMessages: deletedMessages.count,
      deletedNotifications: deletedNotifications.count,
      cutoffDate: thirtyDaysAgo.toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        deletedMessages: deletedMessages.count,
        deletedNotifications: deletedNotifications.count,
        cutoffDate: thirtyDaysAgo.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error during auto-cleanup:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup old messages'
    }, { status: 500 });
  }
}

// Auto-cleanup function that can be called by cron job
export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deletedMessages = await prisma.directMessage.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        type: 'message',
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    return NextResponse.json({
      success: true,
      deletedMessages: deletedMessages.count,
      deletedNotifications: deletedNotifications.count
    });

  } catch (error) {
    console.error('❌ Auto-cleanup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
