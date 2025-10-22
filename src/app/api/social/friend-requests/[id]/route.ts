import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session'
;
;
import { db as prisma } from '@/lib/db';
import { notificationService } from '@/lib/notifications';

// PATCH - Accept or reject friend request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = params.id;
    const { action } = await request.json(); // 'accept' or 'reject'
    
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use accept or reject' }, { status: 400 });
    }

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true }
        },
        recipient: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Only recipient can accept/reject
    if (friendRequest.recipientId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to modify this request' }, { status: 403 });
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Friend request already processed' }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update friend request status
      const updatedRequest = await tx.friendRequest.update({
        where: { id: requestId },
        data: { 
          status: action === 'accept' ? 'accepted' : 'rejected',
          respondedAt: new Date()
        }
      });

      // If accepted, create friendship relationship
      if (action === 'accept') {
        await tx.friendship.create({
          data: {
            user1Id: friendRequest.senderId,
            user2Id: friendRequest.recipientId,
            status: 'active'
          }
        });
      }

      return updatedRequest;
    });

    // Send notification to sender
    try {
      const actionText = action === 'accept' ? 'accepted' : 'rejected';
      const emoji = action === 'accept' ? '🎉' : '😔';
      
      await notificationService.createNotification({
        title: `Friend request ${actionText} ${emoji}`,
        message: `${session.user.name || 'Someone'} ${actionText} your friend request`,
        type: 'event',
        category: 'social',
        priority: 'normal',
        recipientId: friendRequest.senderId,
        actionUrl: action === 'accept' ? `/social/profile/${session.user.id}` : '/social/friends',
        actionText: action === 'accept' ? 'View profile' : 'View friends',
        data: { 
          fromUserId: session.user.id,
          toUserId: friendRequest.senderId,
          kind: `FRIEND_REQUEST_${action.toUpperCase()}`,
          senderId: session.user.id,
          friendRequestId: requestId
        },
      });
    } catch (e) {
      console.warn(`Failed to create friend request ${action} notification`, e);
    }

    return NextResponse.json({
      success: true,
      friendRequest: result,
      message: `Friend request ${action}ed successfully`
    });

  } catch (error) {
    console.error('Error processing friend request:', error);
    return NextResponse.json({
      error: 'Failed to process friend request',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE - Cancel/delete friend request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestId = params.id;

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Only sender can cancel their own request
    if (friendRequest.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to cancel this request' }, { status: 403 });
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Can only cancel pending requests' }, { status: 409 });
    }

    // Delete the friend request
    await prisma.friendRequest.delete({
      where: { id: requestId }
    });

    return NextResponse.json({
      success: true,
      message: 'Friend request cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling friend request:', error);
    return NextResponse.json({
      error: 'Failed to cancel friend request',
      details: error.message
    }, { status: 500 });
  }
}
