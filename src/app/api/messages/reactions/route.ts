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

    const { messageId, reaction } = await request.json();
    
    if (!messageId || !reaction) {
      return NextResponse.json({ 
        error: 'Message ID and reaction are required' 
      }, { status: 400 });
    }

    // Check if message exists and user has access
    const message = await prisma.directMessage.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ],
        isDeleted: false
      }
    });

    if (!message) {
      return NextResponse.json({ 
        error: 'Message not found or access denied' 
      }, { status: 404 });
    }

    // Check if user already reacted to this message
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId: {
          messageId: messageId,
          userId: session.user.id
        }
      }
    });

    if (existingReaction) {
      // Update existing reaction
      const updatedReaction = await prisma.messageReaction.update({
        where: {
          messageId_userId: {
            messageId: messageId,
            userId: session.user.id
          }
        },
        data: {
          reaction: reaction
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        reaction: updatedReaction,
        message: 'Reaction updated successfully'
      });
    } else {
      // Create new reaction
      const newReaction = await prisma.messageReaction.create({
        data: {
          messageId: messageId,
          userId: session.user.id,
          reaction: reaction
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        reaction: newReaction,
        message: 'Reaction added successfully'
      });
    }

  } catch (error) {
    console.error('❌ Error managing reaction:', error);
    return NextResponse.json({
      error: 'Failed to manage reaction'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    
    if (!messageId) {
      return NextResponse.json({ 
        error: 'Message ID is required' 
      }, { status: 400 });
    }

    // Remove user's reaction
    const deletedReaction = await prisma.messageReaction.deleteMany({
      where: {
        messageId: messageId,
        userId: session.user.id
      }
    });

    if (deletedReaction.count === 0) {
      return NextResponse.json({ 
        error: 'No reaction found to remove' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('❌ Error removing reaction:', error);
    return NextResponse.json({
      error: 'Failed to remove reaction'
    }, { status: 500 });
  }
}
