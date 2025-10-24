import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db';
import { notificationService } from '@/lib/notifications';

// GET - Get friend requests for current user
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        recipientId: session.user.id,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            referralCode: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedRequests = friendRequests.map(req => ({
      id: req.id,
      senderId: req.senderId,
      recipientId: req.recipientId,
      status: req.status,
      createdAt: req.createdAt.toISOString(),
      respondedAt: req.respondedAt?.toISOString() || null,
      sender: {
        id: req.sender.id,
        name: req.sender.name || 'User',
        username: req.sender.referralCode || req.sender.email?.split('@')[0] || 'user',
        image: req.sender.image || '/api/placeholder/150/150'
      }
    }));

    return NextResponse.json({
      success: true,
      friendRequests: formattedRequests
    });

  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json({
      error: 'Failed to fetch friend requests'
    }, { status: 500 });
  }
}

// POST - Send friend request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientId } = await request.json();

    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient ID is required' }, { status: 400 });
    }

    if (recipientId === session.user.id) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    // Check if request already exists
    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, recipientId },
          { senderId: recipientId, recipientId: session.user.id }
        ],
        status: 'PENDING'
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
    }

    // Check if already friends (via socialFollow)
    const areFriends = await prisma.socialFollow.findFirst({
      where: {
        OR: [
          { followerId: session.user.id, followingId: recipientId },
          { followerId: recipientId, followingId: session.user.id }
        ]
      }
    });

    if (areFriends) {
      return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 });
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: session.user.id,
        recipientId,
        status: 'PENDING'
      }
    });

    // Send notification
    try {
      const sender = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true }
      });

      await notificationService.createNotification({
        title: 'New friend request 👋',
        message: `${sender?.name || session.user.name || 'Someone'} sent you a friend request`,
        type: 'event',
        category: 'social',
        priority: 'normal',
        recipientId,
        actionUrl: `/social/friends`,
        actionText: 'View request',
        data: {
          fromUserId: session.user.id,
          toUserId: recipientId,
          kind: 'FRIEND_REQUEST',
          requestId: friendRequest.id
        }
      });
    } catch (e) {
      console.warn('Failed to send friend request notification:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Friend request sent successfully',
      friendRequest: {
        id: friendRequest.id,
        status: friendRequest.status
      }
    });

  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json({
      error: 'Failed to send friend request'
    }, { status: 500 });
  }
}
