import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET() {
  try {
    // Fetch real stats from Supabase
    const [totalPosts, totalLikes, totalComments, totalMembers] = await Promise.all([
      prisma.socialPost.count({ where: { status: 'ACTIVE' } }),
      prisma.socialLike.count(),
      prisma.socialComment.count(),
      prisma.user.count({ where: { isActive: true } })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalPosts,
        totalLikes,
        totalComments,
        totalMembers
      }
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
