import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session'
;
;
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user by username
    const user = await prisma.user.findFirst({
      where: {
        username: username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        phone: true,
        location: true,
        createdAt: true,
        membershipStatus: true,
        membershipLevel: true,
        totalEarnings: true,
        referralCount: true,
        lastActive: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get additional profile stats
    const postsCount = await prisma.socialPost.count({
      where: { authorId: user.id }
    });

    const followersCount = await prisma.socialFollow.count({
      where: { followingId: user.id }
    });

    const followingCount = await prisma.socialFollow.count({
      where: { followerId: user.id }
    });

    // Check if current user is following this user
    const isFollowing = await prisma.socialFollow.findFirst({
      where: {
        followerId: session.user.id,
        followingId: user.id,
      }
    });

    // Get recent posts (limit 10)
    const recentPosts = await prisma.socialPost.findMany({
      where: {
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
    });

    return NextResponse.json({
      user: {
        ...user,
        postsCount,
        followersCount,
        followingCount,
        isFollowing: !!isFollowing,
        recentPosts,
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
