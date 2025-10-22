import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session'
;
;
import { db as prisma } from '@/lib/db';
import { notificationService } from '@/lib/notifications';

// POST - Add/remove reaction to a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = params.id;
    const { reaction } = await request.json();
    
    // Valid reactions: like, love, laugh, wow, sad, angry
    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
    if (!validReactions.includes(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if post exists
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check if user already has a like on this post
      const existingLike = await tx.socialLike.findUnique({
        where: {
          postId_userId: { postId, userId }
        }
      });

      let actionTaken: 'added' | 'removed';

      if (existingLike) {
        // Remove existing like
        await tx.socialLike.delete({
          where: { id: existingLike.id }
        });
        actionTaken = 'removed';
      } else {
        // Add new like
        await tx.socialLike.create({
          data: {
            postId,
            userId
          }
        });
        actionTaken = 'added';
      }

      // Get like count
      const likeCount = await tx.socialLike.count({
        where: { postId }
      });

      const counts = {
        like: likeCount
      };

      return { actionTaken, counts };
    });

    // Send notification for new reactions (not removals or updates)
    if (result.actionTaken === 'added' && post.authorId !== userId) {
      try {
        const reactor = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        await notificationService.createNotification({
          title: `Post liked ❤️`,
          message: `${reactor?.name || session.user.name || 'Someone'} liked your post`,
          type: 'event',
          category: 'social',
          priority: 'normal',
          recipientId: post.authorId,
          actionUrl: `/social?postId=${post.id}`,
          actionText: 'View Post',
          data: {
            postId: post.id,
            reactorId: userId,
            reactorName: reactor?.name || session.user.name || 'Someone'
          },
        });
      } catch (e) {
        console.warn('Failed to create reaction notification', e);
      }
    }

    return NextResponse.json({
      success: true,
      actionTaken: result.actionTaken,
      reactionCounts: result.counts,
      message: `Reaction ${result.actionTaken} successfully`
    });

  } catch (error) {
    console.error('Error handling post reaction:', error);
    return NextResponse.json({
      error: 'Failed to handle reaction',
      details: error.message
    }, { status: 500 });
  }
}
