import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { content } = await request.json();
    const { messageId } = params;
    
    if (!content?.trim()) {
      return NextResponse.json({ 
        error: 'Content is required' 
      }, { status: 400 });
    }

    // Check if message exists and user owns it
    const message = await prisma.directMessage.findFirst({
      where: {
        id: messageId,
        senderId: session.user.id
      }
    });

    if (!message) {
      return NextResponse.json({ 
        error: 'Message not found or access denied' 
      }, { status: 404 });
    }

    // Update message
    const updatedMessage = await prisma.directMessage.update({
      where: {
        id: messageId
      },
      data: {
        content: content.trim(),
        editedAt: new Date()
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

    return NextResponse.json({
      success: true,
      updatedMessage
    });

  } catch (error) {
    console.error('❌ Error updating message:', error);
    return NextResponse.json({
      error: 'Failed to update message'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { messageId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'soft';
    const { messageId } = params;

    // Check if message exists and user owns it
    const message = await prisma.directMessage.findFirst({
      where: {
        id: messageId,
        senderId: session.user.id
      }
    });

    if (!message) {
      return NextResponse.json({ 
        error: 'Message not found or access denied' 
      }, { status: 404 });
    }

    if (type === 'hard') {
      // Hard delete - remove from database
      await prisma.directMessage.delete({
        where: {
          id: messageId
        }
      });
    } else {
      // Soft delete - mark as deleted
      await prisma.directMessage.update({
        where: {
          id: messageId
        },
        data: {
          deletedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Message ${type} deleted successfully`
    });

  } catch (error) {
    console.error('❌ Error deleting message:', error);
    return NextResponse.json({
      error: 'Failed to delete message'
    }, { status: 500 });
  }
}
