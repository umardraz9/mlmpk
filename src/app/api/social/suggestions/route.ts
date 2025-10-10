import { NextResponse } from 'next/server';
// @ts-expect-error - NextAuth getServerSession import issue
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// GET /api/social/suggestions - Get user suggestions (active users with posts)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Find active users (users who have created any posts)
    const activeUsers = await prisma.socialPost.findMany({
      where: {
        status: 'ACTIVE',
        ...(currentUserId && { authorId: { not: currentUserId } })
      },
      select: {
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            referralCode: true,
            membershipPlan: true,
            createdAt: true
          }
        }
      },
      distinct: ['authorId'],
      take: 20,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get unique users from posts
    const users = activeUsers.map(p => p.author);

    // If no active users found, get any users from database
    let finalUsers = users;
    if (users.length === 0) {
      finalUsers = await prisma.user.findMany({
        where: {
          ...(currentUserId && { id: { not: currentUserId } }),
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          referralCode: true,
          membershipPlan: true,
          createdAt: true
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // Transform to match expected format
    const suggestions = finalUsers.slice(0, 10).map(user => ({
      id: user.id,
      name: user.name || 'User',
      username: user.referralCode || user.email?.split('@')[0] || 'user',
      image: user.image || '/api/placeholder/150/150',
      bio: `${user.membershipPlan || 'Member'}`,
      createdAt: user.createdAt.toISOString(),
      mutualFriends: 0, // TODO: Calculate actual mutual friends
      isFollowing: false
    }));

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
