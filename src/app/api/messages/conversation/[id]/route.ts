import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db as prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const conversationId = params.id;

    // Get all messages for this conversation (both sent and received)
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

    console.log('📨 Fetched conversation messages:', {
      conversationId,
      userId: session.user.id,
      messageCount: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        sender: m.sender.name,
        recipient: m.recipient.name,
        content: m.content.substring(0, 30)
      }))
    });

    return NextResponse.json({
      success: true,
      messages: messages
    });

  } catch (error) {
    console.error('❌ Error fetching conversation messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
