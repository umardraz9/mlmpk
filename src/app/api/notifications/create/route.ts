import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, type, category, recipientId, data } = await req.json();

    if (!title || !message || !recipientId) {
      return NextResponse.json({ 
        error: 'Title, message, and recipientId are required' 
      }, { status: 400 });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true }
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title: title,
        message: message,
        type: type || 'info',
        category: category || 'general',
        recipientId: recipientId,
        createdById: session.user.id,
        isRead: false,
        data: data ? JSON.stringify(data) : null
      },
      include: {
        createdBy: {
          select: { id: true, name: true, image: true }
        },
        recipient: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log('Notification created:', {
      id: notification.id,
      title: notification.title,
      recipient: recipient.name,
      type: notification.type
    });

    return NextResponse.json({
      success: true,
      notification: notification,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({
      error: 'Failed to create notification',
      details: error.message
    }, { status: 500 });
  }
}
