import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Demo reels data
const demoReels = [
  {
    id: '1',
    videoUrl: '/videos/demo-reel-1.mp4',
    thumbnailUrl: '/images/reels/reel-1-thumb.jpg',
    caption: 'Amazing MLM success story! 🚀 From zero to hero in just 3 months!',
    author: {
      id: 'user-1',
      name: 'Sarah Ahmed',
      username: 'sarah_success',
      image: '/images/avatars/sarah.jpg'
    },
    likes: 245,
    comments: 32,
    shares: 18,
    duration: 45,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: '2',
    videoUrl: '/videos/demo-reel-2.mp4',
    thumbnailUrl: '/images/reels/reel-2-thumb.jpg',
    caption: 'Daily routine of a successful MLM entrepreneur 💪 #MLMLife #Success',
    author: {
      id: 'user-2',
      name: 'Ahmed Khan',
      username: 'ahmed_entrepreneur',
      image: '/images/avatars/ahmed.jpg'
    },
    likes: 189,
    comments: 24,
    shares: 12,
    duration: 38,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
  },
  {
    id: '3',
    videoUrl: '/videos/demo-reel-3.mp4',
    thumbnailUrl: '/images/reels/reel-3-thumb.jpg',
    caption: 'Tips for building your MLM network effectively 📈 #NetworkMarketing',
    author: {
      id: 'user-3',
      name: 'Fatima Ali',
      username: 'fatima_leader',
      image: '/images/avatars/fatima.jpg'
    },
    likes: 156,
    comments: 19,
    shares: 8,
    duration: 52,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
  }
];

// GET /api/social/reels - Get trending reels
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      reels: demoReels
    });

  } catch (error) {
    console.error('Failed to fetch reels:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch reels' 
    }, { status: 500 });
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
