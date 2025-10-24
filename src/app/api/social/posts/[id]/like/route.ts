import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'

import { notificationService } from '@/lib/notifications'

// POST - Toggle like on a post with enhanced features
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
      // Check if user already liked the post
      const existingLike = await tx.socialLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: session.user.id
          }
        }
      })

      let isLiked = false
      let actionTaken = ''

      if (existingLike) {
        // Unlike the post
        await tx.socialLike.delete({
          where: { id: existingLike.id }
        })
        isLiked = false
        actionTaken = 'unliked'
      } else {
        // Like the post
        await tx.socialLike.create({
          data: {
            postId,
            userId: session.user.id
          }
        })
        isLiked = true
        actionTaken = 'liked'

        // Award points to post author (but not to self)
        if (post.authorId !== session.user.id) {
          await tx.user.update({
            where: { id: post.authorId },
            data: {
              totalPoints: { increment: 2 }
            }
          })
        }
      }

      // Get updated counts and recent likes
      const [likesCount, recentLikes] = await Promise.all([
        tx.socialLike.count({
          where: { postId }
        }),
        tx.socialLike.findMany({
          where: { postId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                username: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ])

      return {
        isLiked,
        likesCount,
        actionTaken,
        recentLikes: recentLikes.map(like => ({
          userId: like.user.id,
          name: like.user.name || 'Anonymous',
          username: like.user.username || `@user${like.user.id.slice(-4)}`,
          avatar: like.user.avatar || '/api/placeholder/30/30',
          createdAt: like.createdAt
        }))
      }
    })

    // Fire notification when a post is liked (not on unlike)
    if (result.actionTaken === 'liked' && post.authorId !== session.user.id) {
      try {
        const liker = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
        await notificationService.createNotification({
          title: 'New post like ',
          message: `${liker?.name || session.user.name || 'Someone'} liked your post`,
          type: 'event',
          category: 'social',
          priority: 'normal',
          recipientId: post.authorId,
          actionUrl: `/social?postId=${post.id}`,
          actionText: 'View Post',
          data: {
            postId: post.id,
            likerId: session.user.id,
            likerName: liker?.name || session.user.name || 'Someone'
          },
        })
      } catch (e) {
        console.warn('Failed to create post like notification', e)
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: result.actionTaken === 'liked' ? 
        `You liked ${post.author.name || 'this user'}'s post!` : 
        'Post unliked'
    })

  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to toggle like' 
    }, { status: 500 })
  }
}
