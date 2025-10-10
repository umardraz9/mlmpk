import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/blog/posts/[slug]/bookmark
// body: { action?: 'add' | 'remove' }
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { slug } = params;
    const body = await request.json().catch(() => ({}));
    const action: 'add' | 'remove' | undefined = body?.action;

    const post = await db.blogPost.findUnique({ where: { slug } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const existing = await db.favorite.findUnique({
      where: { userId_type_targetId: { userId: session.user.id, type: 'ARTICLE', targetId: post.id } },
    }).catch(() => null);

    if (existing && action !== 'add') {
      await db.favorite.delete({ where: { userId_type_targetId: { userId: session.user.id, type: 'ARTICLE', targetId: post.id } } });
    } else if (!existing && action !== 'remove') {
      await db.favorite.create({ data: { userId: session.user.id, type: 'ARTICLE', targetId: post.id } });
    }

    const count = await db.favorite.count({ where: { type: 'ARTICLE', targetId: post.id } });
    const bookmarked = await db.favorite.findUnique({
      where: { userId_type_targetId: { userId: session.user.id, type: 'ARTICLE', targetId: post.id } },
      select: { id: true },
    });

    return NextResponse.json({ bookmarked: Boolean(bookmarked), bookmarks: count });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 });
  }
}
