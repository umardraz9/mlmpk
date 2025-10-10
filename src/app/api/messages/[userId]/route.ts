import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const currentUserId = session.user.id;
    const url = new URL(req.url);
    const sinceMessageId = url.searchParams.get('since');

    // Build where clause for messages
    let whereClause: any = {
      OR: [
        { senderId: currentUserId, recipientId: userId },
        { senderId: userId, recipientId: currentUserId }
      ]
    };

    // If polling for new messages, only get messages after the specified ID
    if (sinceMessageId) {
      const sinceMessage = await prisma.directMessage.findUnique({
        where: { id: sinceMessageId },
        select: { createdAt: true }
      });

      if (sinceMessage) {
        whereClause.createdAt = {
          gt: sinceMessage.createdAt
        };
      }
    }

    // Get conversation between current user and target user
    const messages = await prisma.directMessage.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true }
        },
        recipient: {
          select: { id: true, name: true, email: true, image: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        username: true,
        createdAt: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark messages as read (only if not polling for new messages)
    if (!sinceMessageId) {
      await prisma.directMessage.updateMany({
        where: {
          senderId: userId,
          recipientId: currentUserId,
          status: { not: 'read' }
        },
        data: { status: 'read' }
      });
    }

    return NextResponse.json({
      success: true,
      messages: messages.map(msg => ({
        ...msg,
        images: msg.images ? (
          typeof msg.images === 'string'
            ? (msg.images.trim() ? JSON.parse(msg.images) : [])
            : msg.images
        ) : [],
        attachments: msg.attachments ? (
          typeof msg.attachments === 'string'
            ? (msg.attachments.trim() ? JSON.parse(msg.attachments) : [])
            : msg.attachments
        ) : [],
        sender: {
          ...msg.sender,
          name: msg.sender.name || msg.sender.email || 'Unknown User'
        },
        recipient: {
          ...msg.recipient,
          name: msg.recipient.name || msg.recipient.email || 'Unknown User'
        }
      })),
      targetUser: {
        ...targetUser,
        name: targetUser.name || 'Unknown User'
      },
      currentUserId: currentUserId
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({
      error: 'Failed to get messages',
      details: error.message
    }, { status: 500 });
  }
}
