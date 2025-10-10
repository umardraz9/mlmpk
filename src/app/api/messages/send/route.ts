import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    let recipientId, content, attachments = [], images = [];
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await request.formData();
      recipientId = formData.get('recipientId') as string;
      content = formData.get('content') as string;
      
      // Handle file attachments
      const attachmentFiles = [];
      const imageFiles = [];
      
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('attachment_') && value instanceof File) {
          if (value.type.startsWith('image/')) {
            imageFiles.push(value.name);
          } else {
            attachmentFiles.push(value.name);
          }
        }
      }
      
      attachments = attachmentFiles;
      images = imageFiles;
    } else {
      // Handle JSON
      const body = await request.json();
      recipientId = body.recipientId;
      content = body.content;
      attachments = body.attachments || [];
      images = body.images || [];
    }
    
    if (!recipientId) {
      return NextResponse.json({ success: false, error: 'Recipient ID is required' }, { status: 400 });
    }

    if (!content?.trim() && (!attachments || attachments.length === 0) && (!images || images.length === 0)) {
      return NextResponse.json({ success: false, error: 'Message content, attachments, or images are required' }, { status: 400 });
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
        success: false, 
        error: 'Rate limit exceeded. You can only send 30 messages per hour.' 
      }, { status: 429 });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true }
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Create message
    const message = await prisma.directMessage.create({
      data: {
        senderId: session.user.id,
        recipientId: recipientId,
        content: content?.trim() || '',
        messageType: (images && images.length > 0) ? 'media' : 'text',
        attachments: attachments ? JSON.stringify(attachments) : null,
        images: images ? JSON.stringify(images) : null
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        },
        recipient: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    // Create notification for recipient with better error handling
    let notification = null;
    try {
      notification = await prisma.notification.create({
        data: {
          title: 'New Message',
          message: `${session.user.name || 'Someone'} sent you a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          type: 'message',
          category: 'social',
          recipientId: recipientId,
          createdById: session.user.id,
          isRead: false,
          isActive: true,
          isDelivered: false,
          actionUrl: `/messages?userId=${session.user.id}`,
          actionText: 'Reply',
          data: JSON.stringify({
            messageId: message.id,
            senderId: session.user.id,
            senderName: session.user.name,
            messageContent: content
          })
        }
      });

      console.log('✅ Message and notification created successfully:', {
        messageId: message.id,
        notificationId: notification.id,
        sender: session.user.name,
        recipient: recipient.name,
        content: content.substring(0, 30)
      });
    } catch (notificationError) {
      console.error('❌ Failed to create notification (but message was sent):', {
        error: notificationError.message,
        messageId: message.id,
        recipientId: recipientId,
        senderId: session.user.id
      });
      
      // Try a simpler notification creation as fallback
      try {
        notification = await prisma.notification.create({
          data: {
            title: 'New Message',
            message: `You received a new message from ${session.user.name || 'Someone'}`,
            type: 'message',
            category: 'social',
            recipientId: recipientId,
            createdById: session.user.id,
            isRead: false
          }
        });
        console.log('✅ Fallback notification created:', notification.id);
      } catch (fallbackError) {
        console.error('❌ Fallback notification also failed:', fallbackError.message);
      }
    }

    // Parse JSON fields for response
    const responseMessage = {
      ...message,
      images: message.images ? JSON.parse(message.images) : [],
      attachments: message.attachments ? JSON.parse(message.attachments) : []
    };

    return NextResponse.json({
      success: true,
      message: responseMessage,
      notification: notification ? {
        id: notification.id,
        created: true,
        message: 'Notification sent to recipient successfully'
      } : {
        created: false,
        message: 'Message sent but notification creation failed'
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({
      error: 'Failed to send message',
      details: error.message
    }, { status: 500 });
  }
}
