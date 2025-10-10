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

    const { recipientId, content, replyToId, attachments, images } = await request.json();
    
    if (!recipientId || (!content && (!attachments || attachments.length === 0) && (!images || images.length === 0))) {
      return NextResponse.json({ 
        error: 'Recipient ID and content or attachments are required' 
      }, { status: 400 });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true, isActive: true }
    });

    if (!recipient || !recipient.isActive) {
      return NextResponse.json({ 
        error: 'Recipient not found or inactive' 
      }, { status: 404 });
    }

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
        error: 'Cannot send message to blocked user' 
      }, { status: 400 });
    }

    // Rate limiting: Check messages sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMessagesCount = await prisma.directMessage.count({
      where: {
        senderId: session.user.id,
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentMessagesCount >= 30) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. You can only send 30 messages per hour.',
        rateLimitInfo: {
          limit: 30,
          used: recentMessagesCount,
          remaining: 0,
          resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      }, { status: 429 });
    }

    // Validate reply message if replyToId is provided
    let replyToMessage = null;
    if (replyToId) {
      replyToMessage = await prisma.directMessage.findFirst({
        where: {
          id: replyToId,
          OR: [
            { senderId: session.user.id },
            { recipientId: session.user.id }
          ],
          isDeleted: false
        }
      });

      if (!replyToMessage) {
        return NextResponse.json({ 
          error: 'Reply message not found or access denied' 
        }, { status: 404 });
      }
    }

    // Create message with enhanced fields
    const message = await prisma.directMessage.create({
      data: {
        senderId: session.user.id,
        recipientId: recipientId,
        content: content,
        messageType: images && images.length > 0 ? 'media' : 'text',
        attachments: attachments ? JSON.stringify(attachments) : null,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        replyToId: replyToId || null
      },
      include: {
        sender: { select: { id: true, name: true, email: true, image: true } },
        recipient: { select: { id: true, name: true, email: true, image: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { name: true } }
          }
        }
      }
    });

    // Create notification for recipient
    let notification = null;
    try {
      const notificationMessage = replyToId 
        ? `${senderName} replied to your message`
        : `${senderName} sent you a message`;

      notification = await notificationService.createNotification({
        title: 'New message 💬',
        message: notificationMessage,
        type: 'message',
        category: 'communication',
        priority: 'normal',
        recipientId: recipientId,
        actionUrl: `/messages?userId=${session.user.id}`,
        actionText: 'View Message',
        data: {
          senderId: session.user.id,
          senderName,
          messageId: message.id,
          messagePreview: content ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : 'Sent an attachment'
        }
      });

      console.log('✅ Enhanced message and notification created:', {
        messageId: message.id,
        notificationId: notification.id,
        sender: session.user.name,
        recipient: recipient.name,
        isReply: !!replyToId,
        hasAttachments: attachments && attachments.length > 0
      });
    } catch (notificationError) {
      console.error('❌ Failed to create notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: message,
      rateLimitInfo: {
        used: recentMessagesCount + 1,
        limit: 30,
        remaining: 29 - recentMessagesCount
      }
    });

  } catch (error) {
    console.error('❌ Error sending enhanced message:', error);
    return NextResponse.json({
      error: 'Failed to send message. Please try again.'
    }, { status: 500 });
  }
}
