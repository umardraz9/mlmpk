import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error - NextAuth getServerSession import issue
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// POST - Toggle mute (turn off notifications for this post) for current user
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = params.id;

    const post = await prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existing = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        targetId: postId,
        type: 'POST_MUTE',
      },
      select: { id: true },
    });

    let isMuted = false;
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      isMuted = false;
    } else {
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          type: 'POST_MUTE',
          targetId: postId,
        },
      });
      isMuted = true;
    }

    const message = isMuted ? 'Turn off notifications successfully' : 'Turn on notifications successfully';
    return NextResponse.json({ success: true, isMuted, message });
  } catch (error) {
    console.error('Error toggling mute:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
