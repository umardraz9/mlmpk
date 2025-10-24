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

    // Fetch comments with comprehensive data
    const [comments, total] = await Promise.all([
      prisma.socialComment.findMany({
        where: { postId },
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              totalPoints: true,
              createdAt: true,
              isActive: true
            }
          }
        }
      }),
      prisma.socialComment.count({ where: { postId } })
    ])

    // Format comments with enhanced data
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: comment.user.id,
        name: comment.user.name || 'Anonymous',
        username: comment.user.username || `@user${comment.user.id.slice(-4)}`,
        avatar: comment.user.avatar || '/api/placeholder/40/40',
        level: Math.floor((comment.user.totalPoints || 0) / 1000) + 1,
        verified: (comment.user.totalPoints || 0) > 5000,
        joinedDate: comment.user.createdAt,
        isActive: comment.user.isActive,
        isAuthor: comment.user.id === post.authorId
      }
    }))

    return NextResponse.json({
      success: true,
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      meta: {
        postId,
        postAuthor: post.author.name || 'Anonymous',
        sortBy,
        totalComments: total
      }
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch comments' 
    }, { status: 500 })
  }
}

// POST - Add comment to a post with enhanced features
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
    const { content, parentId = null } = body // Support for reply comments

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Comment content is required' 
      }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ 
        success: false,
        error: 'Comment too long (max 1000 characters)' 
      }, { status: 400 })
    }

    // Check rate limiting (max 20 comments per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentComments = await prisma.socialComment.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: oneHourAgo
        }
      }
    })

    if (recentComments >= 20) {
      return NextResponse.json({ 
        success: false,
        error: 'Rate limit exceeded. Maximum 20 comments per hour.' 
      }, { status: 429 })
    }

    // Check if post exists and get author info
    const post = await prisma.socialPost.findUnique({
      where: { id: postId, status: 'ACTIVE' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            totalPoints: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ 
        success: false,
        error: 'Post not found' 
      }, { status: 404 })
    }

    // Use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create comment
      const comment = await tx.socialComment.create({
        data: {
          content: content.trim(),
          postId,
          userId: session.user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              totalPoints: true,
              createdAt: true,
              isActive: true
            }
          }
        }
      })

      // Award points to commenter and post author
      const pointsForCommenting = 5
      const pointsForReceivingComment = 3

      await tx.user.update({
        where: { id: session.user.id },
        data: { totalPoints: { increment: pointsForCommenting } }
      })

      // Award points to post author (if not self)
      if (post.authorId !== session.user.id) {
        await tx.user.update({
          where: { id: post.authorId },
          data: { totalPoints: { increment: pointsForReceivingComment } }
        })
      }

      return comment
    })

    // Get updated comment count for the post
    const totalComments = await prisma.socialComment.count({
      where: { postId }
    })

    // Format response with comprehensive data
    const formattedComment = {
      id: result.id,
      content: result.content,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      user: {
        id: result.user.id,
        name: result.user.name || 'Anonymous',
        username: result.user.username || `@user${result.user.id.slice(-4)}`,
        avatar: result.user.avatar || '/api/placeholder/40/40',
        level: Math.floor((result.user.totalPoints || 0) / 1000) + 1,
        verified: (result.user.totalPoints || 0) > 5000,
        joinedDate: result.user.createdAt,
        isActive: result.user.isActive,
        isAuthor: result.user.id === post.authorId
      }
    }

    // Fire notification when someone comments on a post (not self-comment)
    if (post.authorId !== session.user.id) {
      try {
        const commenter = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
        await notificationService.createNotification({
          title: 'New comment 💬',
          message: `${commenter?.name || session.user.name || 'Someone'} commented on your post`,
          type: 'event',
          category: 'social',
          priority: 'normal',
          recipientId: post.authorId,
          actionUrl: `/social?postId=${post.id}`,
          actionText: 'View Post',
          data: {
            postId: post.id,
            commentId: result.id,
            commenterId: session.user.id,
            commenterName: commenter?.name || session.user.name || 'Someone',
            commentContent: content.substring(0, 100) + (content.length > 100 ? '...' : '')
          },
        })
      } catch (e) {
        console.warn('Failed to create comment notification', e)
      }
    }

    return NextResponse.json({ 
      success: true,
      comment: formattedComment,
      meta: {
        totalComments,
        pointsAwarded: 5,
        postAuthorNotified: post.authorId !== session.user.id
      },
      message: `Comment added successfully! You earned 5 points.${post.authorId !== session.user.id ? ` ${post.author.name} earned 3 points.` : ''}`
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create comment' 
    }, { status: 500 })
  }
}
