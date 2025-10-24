import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// GET /api/social/suggestions - Get user suggestions (demo data)
export async function GET() {
  try {
    const session = await getSession();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return demo suggestions
    const suggestions = [
      {
        id: 'user-2',
        name: 'Ahmed Khan',
        username: '@ahmedkhan',
        image: '/api/placeholder/50/50',
        bio: 'MLM Enthusiast | Team Leader',
        membershipPlan: 'PREMIUM',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalPosts: 24,
        level: 3,
        mutualFriends: 5,
        isFollowing: false
      },
      {
        id: 'user-3',
        name: 'Fatima Ali',
        username: '@fatimali',
        image: '/api/placeholder/50/50',
        bio: 'Digital Marketer | MLM Expert',
        membershipPlan: 'PREMIUM',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        totalPosts: 18,
        level: 2,
        mutualFriends: 3,
        isFollowing: false
      },
      {
        id: 'user-4',
        name: 'Hassan Ali',
        username: '@hassanali',
        image: '/api/placeholder/50/50',
        bio: 'Business Developer | Network Builder',
        membershipPlan: 'BASIC',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        totalPosts: 12,
        level: 1,
        mutualFriends: 2,
        isFollowing: false
      }
    ];

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
