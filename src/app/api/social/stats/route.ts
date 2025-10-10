import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return mock stats data for now
    return NextResponse.json({
      success: true,
      stats: {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalMembers: 0
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
