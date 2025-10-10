import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get all conversations for the current user
    const conversations = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group conversations by the other user
    const conversationMap = new Map();
    
    for (const message of conversations) {
      const otherUser = message.senderId === session.user.id ? message.recipient : message.sender;
      const conversationKey = otherUser.id;
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          id: conversationKey,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name || otherUser.email || 'Unknown User',
            email: otherUser.email,
            image: otherUser.image
          },
          lastMessage: {
            ...message,
            images: message.images ? (
              typeof message.images === 'string' ? 
                (message.images.trim() ? JSON.parse(message.images) : []) : 
                message.images
            ) : [],
            attachments: message.attachments ? (
              typeof message.attachments === 'string' ? 
                (message.attachments.trim() ? JSON.parse(message.attachments) : []) : 
                message.attachments
            ) : []
          },
          unreadCount: 0,
          messages: []
        });
      }
      
      conversationMap.get(conversationKey).messages.push({
        ...message,
        images: message.images ? (
          typeof message.images === 'string' ? 
            (message.images.trim() ? JSON.parse(message.images) : []) : 
            message.images
        ) : [],
        attachments: message.attachments ? (
          typeof message.attachments === 'string' ? 
            (message.attachments.trim() ? JSON.parse(message.attachments) : []) : 
            message.attachments
        ) : []
      });
    }

    // Calculate unread counts and online status
    for (const [userId, conversation] of conversationMap) {
      const unreadCount = await prisma.directMessage.count({
        where: {
          senderId: userId,
          recipientId: session.user.id
        }
      });
      conversation.unreadCount = unreadCount;

      // Determine online status based on recent activity
      const recentMessages = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: session.user.id },
            { senderId: session.user.id, recipientId: userId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });

      if (recentMessages.length > 0) {
        const lastMessageTime = new Date(recentMessages[0].createdAt);
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Consider user online if they sent a message in the last 5 minutes
        conversation.isOnline = lastMessageTime > fiveMinutesAgo;
        conversation.lastSeen = recentMessages[0].createdAt;
      } else {
        conversation.isOnline = false;
        conversation.lastSeen = null;
      }
    }

    const conversationsArray = Array.from(conversationMap.values());

    console.log('📱 Fetched conversations:', {
      userId: session.user.id,
      userName: session.user.name,
      conversationCount: conversationsArray.length,
      conversations: conversationsArray.map(c => ({
        otherUser: c.otherUser.name,
        lastMessage: c.lastMessage?.content?.substring(0, 30),
        unreadCount: c.unreadCount
      }))
    });

    return NextResponse.json({
      success: true,
      conversations: conversationsArray
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
