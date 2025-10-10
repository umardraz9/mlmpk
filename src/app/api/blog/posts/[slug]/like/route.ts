import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/blog/posts/[slug]/like
// body: { action: 'like' | 'unlike' }
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const body = await request.json().catch(() => ({}));
    const action = body?.action === 'unlike' ? 'unlike' : 'like';

    const post = await db.blogPost.findUnique({ where: { slug } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const newLikes = Math.max(0, (post.likes || 0) + (action === 'like' ? 1 : -1));

    const updated = await db.blogPost.update({
      where: { id: post.id },
      data: { likes: newLikes },
      select: { likes: true },
    });

    return NextResponse.json({ likes: updated.likes });
  } catch (error) {
    console.error('Error updating like:', error);
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 });
  }
}
