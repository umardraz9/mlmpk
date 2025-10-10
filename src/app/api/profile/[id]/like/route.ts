import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { notificationService } from '@/lib/notifications'

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetUserId = context.params.id
    const userId = session.user.id

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing target user id' }, { status: 400 })
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: 'Cannot like your own profile' }, { status: 400 })
    }

    // Toggle like using compound unique
    const existing = await prisma.profileLike.findUnique({
      where: { userId_targetUserId: { userId, targetUserId } },
    })

    let liked = false
    if (existing) {
      await prisma.profileLike.delete({
        where: { id: existing.id },
      })
      liked = false
    } else {
      await prisma.profileLike.create({
        data: { userId, targetUserId },
      })
      liked = true
    }

    const likesCount = await prisma.profileLike.count({ where: { targetUserId } })

    // Fire notification when a like is created (not on unlike)
    if (liked) {
      try {
        const liker = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
        await notificationService.createNotification({
          title: 'New profile like ❤️',
          message: `${liker?.name || 'Someone'} liked your profile`,
          type: 'event',
          category: 'social',
          priority: 'normal',
          recipientId: targetUserId,
          actionUrl: `/social/profile/${userId}`,
          actionText: 'View profile',
          data: { fromUserId: userId, toUserId: targetUserId, kind: 'PROFILE_LIKE' },
        })
      } catch (e) {
        console.warn('Failed to create profile like notification', e)
      }
    }

    return NextResponse.json({ liked, likesCount })
  } catch (err) {
    console.error('Profile like error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
