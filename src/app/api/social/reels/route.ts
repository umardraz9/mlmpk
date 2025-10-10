import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { db as prisma } from '@/lib/db';

// GET /api/social/reels - Get trending reels from database
export async function GET() {
  try {
    // Fetch posts with videos (reels)
    const reels = await prisma.socialPost.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { videoUrl: { not: null } },
          { type: 'reel' }
        ]
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 10,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            referralCode: true
          }
        }
      }
    });

    // Transform to match expected format
    const formattedReels = reels.map(reel => ({
      id: reel.id,
      videoUrl: reel.videoUrl || '',
      thumbnailUrl: reel.coverUrl || reel.mediaUrls?.[0] || '/api/placeholder/300/533',
      caption: reel.content,
      author: {
        id: reel.author.id,
        name: reel.author.name || 'User',
        username: reel.author.referralCode || reel.author.email?.split('@')[0] || 'user',
        image: reel.author.image || '/api/placeholder/150/150'
      },
      likes: 0, // TODO: Count from socialLike table
      comments: 0, // TODO: Count from socialComment table
      shares: 0, // TODO: Count from socialShare table
      duration: 30,
      createdAt: reel.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      reels: formattedReels
    });

  } catch (error) {
    console.error('Failed to fetch reels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/social/reels - Create a new reel
export async function POST(request: NextRequest) {
  try {
    // For development, return success without actually saving
    // In production, this would save to database
    const { videoUrl, thumbnailUrl, caption, duration } = await request.json();

    if (!videoUrl || !caption) {
      return NextResponse.json({ error: 'Video URL and caption are required' }, { status: 400 });
    }

    const newReel = {
      id: Date.now().toString(),
      videoUrl,
      thumbnailUrl,
      caption,
      author: {
        id: 'current-user-id', // Would come from session
        name: 'Current User', // Would come from session
        username: 'currentuser', // Would come from session
        image: '/api/placeholder/150/150' // Would come from session
      },
      likes: 0,
      comments: 0,
      shares: 0,
      duration: duration || 30,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      reel: newReel,
      message: 'Reel created successfully (mock implementation)'
    });

  } catch (error) {
    console.error('Failed to create reel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
