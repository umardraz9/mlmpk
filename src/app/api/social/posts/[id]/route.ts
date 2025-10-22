import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session'
// @ts-expect-error - NextAuth getServerSession import issue
;
;
import { db as prisma } from '@/lib/db';

// PATCH /api/social/posts/[id] - update content (author only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = params.id;
    const body = await request.json();
    const content = (body?.content ?? '').toString();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Content too long (max 2000 characters)' }, { status: 400 });
    }

    const post = await prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.socialPost.update({
      where: { id: postId },
      data: { content: content.trim() },
      include: { author: true, _count: { select: { likes: true, comments: true, shares: true } } },
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE /api/social/posts/[id] - soft delete (author or admin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = params.id;
    const post = await prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // @ts-expect-error session user may include isAdmin flag in our app
    const isAdmin = Boolean(session.user?.isAdmin);
    if (post.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.socialPost.update({
      where: { id: postId },
      data: { status: 'DELETED' },
    });

    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
