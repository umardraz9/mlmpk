import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { conversationId } = await params;

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Conversation ID is required' }, { status: 400 });
    }

    // Get messages for this conversation (conversationId is actually the other user's ID)
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            recipientId: conversationId
          },
          {
            senderId: conversationId,
            recipientId: session.user.id
          }
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
        createdAt: 'asc'
      }
    });

    // Parse JSON fields safely
    const parsedMessages = messages.map(message => ({
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
    }));

    console.log('📨 Fetched messages for conversation:', {
      conversationId,
      userId: session.user.id,
      messageCount: parsedMessages.length
    });

    return NextResponse.json({
      success: true,
      messages: parsedMessages
    });

  } catch (error) {
    console.error('❌ Error fetching conversation messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
