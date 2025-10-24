import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session'
// @ts-expect-error - NextAuth getServerSession import issue
;
;
import { db as prisma } from '@/lib/db';

// POST - Pin/Unpin a post for the current user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = params.id;
    const { action } = await request.json().catch(() => ({ action: 'pin' as 'pin' | 'unpin' }));
    if (!['pin', 'unpin'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const post = await prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existing = await prisma.favorite.findFirst({
      where: { userId: session.user.id, targetId: postId, type: 'POST_PIN' },
      select: { id: true },
    });

    if (action === 'pin') {
      if (!existing) {
        await prisma.favorite.create({
          data: { userId: session.user.id, type: 'POST_PIN', targetId: postId },
        });
      }
      return NextResponse.json({ success: true, isPinned: true, message: 'Pin post successfully' });
    } else {
      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } });
      }
      return NextResponse.json({ success: true, isPinned: false, message: 'Unpin post successfully' });
    }
  } catch (error) {
    console.error('Error pinning post:', error);
    return NextResponse.json({ error: 'Failed to update pin' }, { status: 500 });
  }
}
