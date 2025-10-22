import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'

import { db as prisma } from '@/lib/db'
import { notificationService } from '@/lib/notifications'

// POST - Record a share for a post (idempotent per user)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const { id: postId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure post exists and is active
    const post = await prisma.socialPost.findUnique({
      where: { id: postId, status: 'ACTIVE' },
      select: { id: true, authorId: true }
    })

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    const userId = session.user.id

    const result = await prisma.$transaction(async (tx) => {
      // Check if already shared by this user
      const existing = await tx.socialShare.findFirst({
        where: {
          postId: postId,
          userId: userId
        }
      })

      if (!existing) {
        await tx.socialShare.create({
          data: { postId, userId }
        })
      }

      const sharesCount = await tx.socialShare.count({ where: { postId } })

      // Optionally: award points to author on first share by this user
      // Skipped or can be enabled like below:
      // if (!existing && post.authorId !== userId) {
      //   await tx.user.update({
      //     where: { id: post.authorId },
      //     data: { totalPoints: { increment: 1 } },
      //   })
      // }

      return { sharesCount, alreadyShared: Boolean(existing) }
    })

    // Send notification for new shares (not re-shares)
    if (!result.alreadyShared && post.authorId !== userId) {
      try {
        const sharer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
        await notificationService.createNotification({
          title: 'Post shared ',
          message: `${sharer?.name || session.user.name || 'Someone'} shared your post`,
          type: 'event',
          category: 'social',
          priority: 'normal',
          recipientId: post.authorId,
          actionUrl: `/social?postId=${post.id}`,
          actionText: 'View Post',
          data: {
            postId: post.id,
            sharerId: userId,
            sharerName: sharer?.name || session.user.name || 'Someone'
          },
        })
      } catch (e) {
        console.warn('Failed to create share notification', e)
      }
    }

    return NextResponse.json({
      success: true,
      sharesCount: result.sharesCount,
      alreadyShared: result.alreadyShared,
      message: result.alreadyShared ? 'Already shared' : 'Share recorded'
    })
  } catch (error) {
    console.error('Error recording share:', error)
    return NextResponse.json({ success: false, error: 'Failed to record share' }, { status: 500 })
  }
}
