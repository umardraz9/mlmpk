import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'You must be logged in to mark messages as read'
      }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({
        error: 'Bad Request',
        message: 'userId is required'
      }, { status: 400 })
    }

    const currentUserId = session.user.id

    // Mark all messages from userId to currentUserId as read
    const result = await prisma.message.updateMany({
      where: {
        senderId: userId,
        recipientId: currentUserId,
        status: {
          not: 'read'
        }
      },
      data: {
        status: 'read'
      }
    })

    // Update conversation unread count
    await prisma.conversation.updateMany({
      where: {
        participants: {
          every: {
            userId: {
              in: [currentUserId, userId]
            }
          }
        }
      },
      data: {
        unreadCount: {
          decrement: result.count
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
      updatedCount: result.count
    })

  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to mark messages as read'
    }, { status: 500 })
  }
}
