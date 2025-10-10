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

    const { messageId, recipientIds, additionalMessage } = await request.json();
    
    if (!messageId || !recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ 
        error: 'Message ID and recipient IDs are required' 
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
        sender: { select: { id: true, name: true } }
      }
    });

    if (!originalMessage) {
      return NextResponse.json({ 
        error: 'Original message not found or access denied' 
      }, { status: 404 });
    }

    // Validate recipients exist and are not blocked
    const recipients = await prisma.user.findMany({
      where: {
        id: { in: recipientIds },
        isActive: true
      },
      select: { id: true, name: true, email: true }
    });

    if (recipients.length !== recipientIds.length) {
      return NextResponse.json({ 
        error: 'Some recipients not found or inactive' 
      }, { status: 404 });
    }

    // Check for blocked users
    const blockedUsers = await prisma.userBlock.findMany({
      where: {
        OR: [
          {
            blockerId: session.user.id,
            blockedId: { in: recipientIds }
          },
          {
            blockerId: { in: recipientIds },
            blockedId: session.user.id
          }
        ]
      }
    });

    if (blockedUsers.length > 0) {
      const blockedIds = blockedUsers.map(block => 
        block.blockerId === session.user.id ? block.blockedId : block.blockerId
      );
      return NextResponse.json({ 
        error: `Cannot forward to blocked users: ${blockedIds.join(', ')}` 
      }, { status: 400 });
    }

    // Create forwarded messages
    const forwardedMessages = [];
    
    for (const recipientId of recipientIds) {
      const forwardContent = additionalMessage 
        ? `${additionalMessage}\n\n--- Forwarded Message ---\n${originalMessage.content}`
        : `--- Forwarded Message ---\n${originalMessage.content}`;

      const forwardedMessage = await prisma.directMessage.create({
        data: {
          senderId: session.user.id,
          recipientId: recipientId,
          content: forwardContent,
          type: originalMessage.type,
          status: 'sent'
        },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true }
          },
          recipient: {
            select: { id: true, name: true, avatar: true }
          }
        }
      });

      forwardedMessages.push(forwardedMessage);

      // Create notification for recipient
      try {
        await prisma.notification.create({
          data: {
            recipientId: recipientId,
            title: 'Forwarded Message',
            message: `${session.user.name || 'Someone'} forwarded you a message`,
            type: 'message',
            data: JSON.stringify({
              messageId: forwardedMessage.id,
              senderId: session.user.id,
              senderName: session.user.name,
              messageContent: forwardContent,
              isForwarded: true,
              originalMessageId: messageId,
              originalSender: originalMessage.sender.name
            })
          }
        });
      } catch (notificationError) {
        console.error('❌ Failed to create forward notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      forwardedMessages,
      message: `Message forwarded to ${recipients.length} recipient(s)`
    });

  } catch (error) {
    console.error('❌ Error forwarding message:', error);
    return NextResponse.json({
      error: 'Failed to forward message'
    }, { status: 500 });
  }
}
