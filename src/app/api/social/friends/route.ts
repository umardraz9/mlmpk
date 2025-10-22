import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session'
// @ts-expect-error - NextAuth getServerSession import issue
;
;
import { db as prisma } from '@/lib/db';

// GET - Get friends list for current user
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get friendships where current user is either user1 or user2
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ],
        status: 'active'
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            referralCode: true
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            referralCode: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the friends data
    const friends = friendships.map(friendship => {
      // Determine which user is the friend (not the current user)
      const friend = friendship.user1Id === session.user.id
        ? friendship.user2
        : friendship.user1;

      return {
        id: friendship.id,
        user1Id: friendship.user1Id,
        user2Id: friendship.user2Id,
        status: friendship.status,
        createdAt: friendship.createdAt.toISOString(),
        friend: {
          id: friend.id,
          name: friend.name || 'User',
          username: friend.referralCode || friend.email?.split('@')[0] || 'user',
          image: friend.image || '/api/placeholder/150/150'
        }
      };
    });

    return NextResponse.json({
      success: true,
      friends
    });

  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({
      error: 'Failed to fetch friends'
    }, { status: 500 });
  }
}
