import { NextRequest, NextResponse } from 'next/server'
// @ts-expect-error - NextAuth getServerSession import issue
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { notificationService } from '@/lib/notifications'

// POST /api/social/follow
// Body: { userId: string }
// Toggles follow/unfollow for the authenticated user -> target userId
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
    }

    if (userId === session.user.id) {
      return NextResponse.json({ success: false, error: 'Cannot follow yourself' }, { status: 400 })
    }

    const followerId = session.user.id
    const followingId = userId

    console.log('🔍 Follow request:', { followerId, followingId })

    // Check if already following
    const existingFollow = await prisma.socialFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    })

    console.log('🔍 Existing follow:', existingFollow)

    let isFollowing: boolean

    if (existingFollow) {
      // Unfollow
      await prisma.socialFollow.delete({
        where: { id: existingFollow.id }
      })
      isFollowing = false
      console.log('✅ Unfollowed user')
    } else {
      // Follow
      await prisma.socialFollow.create({
        data: {
          followerId,
          followingId
        }
      })
      isFollowing = true
      console.log('✅ Followed user')

      // Send follow notification
      try {
        const follower = await prisma.user.findUnique({
          where: { id: followerId },
          select: { name: true }
        })

        await notificationService.createNotification({
          title: 'New follower 👥',
          message: `${follower?.name || session.user.name || 'Someone'} started following you`,
          type: 'event',
          category: 'social',
          priority: 'normal',
          recipientId: followingId,
          actionUrl: `/social/profile/${followerId}`,
          actionText: 'View profile',
          data: {
            fromUserId: followerId,
            toUserId: followingId,
            kind: 'FOLLOW',
            senderId: followerId
          },
        })
        console.log('✅ Follow notification sent')
      } catch (e) {
        console.warn('❌ Failed to create follow notification:', e)
      }
    }

    // Get updated counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.socialFollow.count({ where: { followingId } }),
      prisma.socialFollow.count({ where: { followerId } })
    ])

    console.log('✅ Follow operation completed:', { isFollowing, followersCount, followingCount })

    return NextResponse.json({
      success: true,
      isFollowing,
      followersCount,
      followingCount
    })

  } catch (error) {
    console.error('❌ Error toggling follow:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to toggle follow',
      details: error.message
    }, { status: 500 })
  }
}
