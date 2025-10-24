import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session'
;
;
import { db as prisma } from '@/lib/db';

// POST - Block/unblock a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.id;
    const currentUserId = session.user.id;

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check if already blocked
      const existingBlock = await tx.userBlock.findUnique({
        where: {
          blockerId_blockedId: { blockerId: currentUserId, blockedId: targetUserId }
        }
      });

      let isBlocked: boolean;

      if (existingBlock) {
        // Unblock user
        await tx.userBlock.delete({ where: { id: existingBlock.id } });
        isBlocked = false;
      } else {
        // Block user
        await tx.userBlock.create({
          data: {
            blockerId: currentUserId,
            blockedId: targetUserId,
            reason: 'User blocked'
          }
        });
        isBlocked = true;

        // Remove any existing follow relationships
        await tx.socialFollow.deleteMany({
          where: {
            OR: [
              { followerId: currentUserId, followingId: targetUserId },
              { followerId: targetUserId, followingId: currentUserId }
            ]
          }
        });
      }

      return { isBlocked, targetUser };
    });

    return NextResponse.json({
      success: true,
      isBlocked: result.isBlocked,
      message: result.isBlocked 
        ? `Blocked ${result.targetUser.name || 'user'}` 
        : `Unblocked ${result.targetUser.name || 'user'}`
    });

  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    return NextResponse.json({
      error: 'Failed to block/unblock user',
      details: error.message
    }, { status: 500 });
  }
}
