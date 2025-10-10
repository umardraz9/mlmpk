import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { messageId, content } = await request.json();
    
    if (!messageId || !content?.trim()) {
      return NextResponse.json({ 
        error: 'Message ID and content are required' 
      }, { status: 400 });
    }

    // Check if original message exists and user has access
    const originalMessage = await prisma.directMessage.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ]
      },
      include: {
        sender: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } }
      }
    });

    if (!originalMessage) {
      return NextResponse.json({ 
        error: 'Original message not found or access denied' 
      }, { status: 404 });
    }

    // Determine recipient (reply to sender if current user is recipient, or to recipient if current user is sender)
    const recipientId = originalMessage.senderId === session.user.id 
      ? originalMessage.recipientId 
      : originalMessage.senderId;

    // Check if users are blocked
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          {
            blockerId: session.user.id,
            blockedId: recipientId
          },
          {
            blockerId: recipientId,
            blockedId: session.user.id
          }
        ]
      }
    });

    if (isBlocked) {
      return NextResponse.json({ 
        error: 'Cannot reply to blocked user' 
      }, { status: 400 });
    }

    // Create reply message
    const replyMessage = await prisma.directMessage.create({
      data: {
        senderId: session.user.id,
        recipientId: recipientId,
        content: content.trim(),
        type: 'text',
        status: 'sent',
        replyToId: messageId
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        },
        recipient: {
          select: { id: true, name: true, avatar: true }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    // Create notification for recipient
    try {
      await prisma.notification.create({
        data: {
          recipientId: recipientId,
          title: 'New Reply',
          message: `${session.user.name || 'Someone'} replied to your message`,
          type: 'message',
          data: JSON.stringify({
            messageId: replyMessage.id,
            senderId: session.user.id,
            senderName: session.user.name,
            messageContent: content.trim(),
            isReply: true,
            originalMessageId: messageId
          })
        }
      });
    } catch (notificationError) {
      console.error('❌ Failed to create reply notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: replyMessage,
      originalMessage: originalMessage
    });

  } catch (error) {
    console.error('❌ Error creating reply:', error);
    return NextResponse.json({
      error: 'Failed to create reply'
    }, { status: 500 });
  }
}
