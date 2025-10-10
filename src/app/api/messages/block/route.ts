import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, reason } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Check if user is already blocked
    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: userId
        }
      }
    });

    if (existingBlock) {
      return NextResponse.json({ error: 'User is already blocked' }, { status: 400 });
    }

    // Create block record
    const block = await prisma.userBlock.create({
      data: {
        blockerId: session.user.id,
        blockedId: userId,
        reason: reason || null
      },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User blocked successfully',
      block
    });

  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Remove block record
    const deletedBlock = await prisma.userBlock.deleteMany({
      where: {
        blockerId: session.user.id,
        blockedId: userId
      }
    });

    if (deletedBlock.count === 0) {
      return NextResponse.json({ error: 'User is not blocked' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('Unblock user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get list of blocked users
    const blockedUsers = await prisma.userBlock.findMany({
      where: {
        blockerId: session.user.id
      },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      blockedUsers
    });

  } catch (error) {
    console.error('Get blocked users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
