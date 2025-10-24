import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// GET - Fetch comments for a post (demo data)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const { id: postId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    console.log('[COMMENTS] Fetching comments for post:', postId)

    // Return demo comments
    const demoComments = [
      {
        id: 'comment-1',
        content: 'Great post! Thanks for sharing.',
        author: {
          id: 'user-2',
          name: 'Ahmed Khan',
          username: '@ahmedkhan',
          image: '/api/placeholder/50/50'
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: 3,
        isLiked: false
      },
      {
        id: 'comment-2', 
        content: 'Very informative content!',
        author: {
          id: 'user-3',
          name: 'Fatima Ali',
          username: '@fatimali',
          image: '/api/placeholder/50/50'
        },
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        likes: 1,
        isLiked: false
      }
    ]

    return NextResponse.json({
      success: true,
      comments: demoComments,
      pagination: {
        page: 1,
        limit: 20,
        total: demoComments.length,
        totalPages: 1
      }
    })

  } catch (error) {
    console.error('[COMMENTS] Error fetching comments:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch comments'
    }, { status: 500 })
  }
}

// POST - Create a new comment (demo)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const { id: postId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Comment content is required'
      }, { status: 400 })
    }

    console.log('[COMMENTS] Creating comment for post:', postId)

    // Create demo comment
    const newComment = {
      id: `comment-${Date.now()}`,
      content: content.trim(),
      author: {
        id: session.user.id,
        name: session.user.name || 'User',
        username: `@user${session.user.id.slice(-4)}`,
        image: session.user.image || '/api/placeholder/50/50'
      },
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
      message: 'Comment created successfully'
    })

  } catch (error) {
    console.error('[COMMENTS] Error creating comment:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create comment'
    }, { status: 500 })
  }
}
