import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'

// Demo social posts data
const demoPosts = [
  {
    id: '1',
    content: 'Just achieved my first milestone in MLM! 🎉 Grateful for this amazing community and the support system. #MLMSuccess #Grateful',
    type: 'text',
    mediaUrls: [],
    author: {
      id: 'user-1',
      name: 'Sarah Ahmed',
      email: 'sarah@example.com',
      image: '/images/avatars/sarah.jpg',
      referralCode: 'SAR001'
    },
    likes: 24,
    comments: 8,
    shares: 3,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: '2',
    content: 'Check out these amazing products from our marketplace! Quality guaranteed 💯',
    type: 'image',
    mediaUrls: ['/images/posts/product-showcase.jpg'],
    author: {
      id: 'user-2',
      name: 'Ahmed Khan',
      email: 'ahmed@example.com',
      image: '/images/avatars/ahmed.jpg',
      referralCode: 'AHM002'
    },
    likes: 45,
    comments: 12,
    shares: 7,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE'
  },
  {
    id: '3',
    content: 'Team building session was incredible! 🚀 Building stronger connections every day.',
    type: 'video',
    mediaUrls: ['/videos/team-building.mp4'],
    videoUrl: '/videos/team-building.mp4',
    author: {
      id: 'user-3',
      name: 'Fatima Ali',
      email: 'fatima@example.com',
      image: '/images/avatars/fatima.jpg',
      referralCode: 'FAT003'
    },
    likes: 67,
    comments: 15,
    shares: 9,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE'
  }
];

// GET - Fetch social posts with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''

    // Filter demo posts based on search and type
    let filteredPosts = [...demoPosts]
    
    if (type && type !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.type === type)
    }
    
    if (search) {
      filteredPosts = filteredPosts.filter(post =>
        post.content.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Pagination
    const skip = (page - 1) * limit
    const paginatedPosts = filteredPosts.slice(skip, skip + limit)
    const total = filteredPosts.length

    return NextResponse.json({
      success: true,
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        totalPosts: total
      }
    })

  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch posts' 
    }, { status: 500 })
  }
}

// POST - Create a new social post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, type = 'text', mediaUrls = [] } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Content is required' 
      }, { status: 400 })
    }

    // Create new post (demo implementation)
    const newPost = {
      id: Date.now().toString(),
      content: content.trim(),
      type,
      mediaUrls,
      author: {
        id: session.user.id,
        name: session.user.name || 'User',
        email: session.user.email || '',
        image: session.user.image || '/images/avatars/default.jpg',
        referralCode: session.user.referralCode || ''
      },
      likes: 0,
      comments: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    }

    return NextResponse.json({
      success: true,
      post: newPost,
      message: 'Post created successfully'
    })

  } catch (error) {
    console.error('Error creating social post:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create post' 
    }, { status: 500 })
  }
}
