import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/blog/posts/[slug]/comments - list approved comments
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const post = await db.blogPost.findUnique({ where: { slug: params.slug }, select: { id: true } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const comments = await db.blogComment.findMany({
      where: { postId: post.id, isApproved: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/blog/posts/[slug]/comments - add a comment (requires login)
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const content = (body?.content || '').toString().trim();
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    const post = await db.blogPost.findUnique({ where: { slug: params.slug }, select: { id: true } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const created = await db.blogComment.create({
      data: {
        content,
        authorId: session.user.id,
        postId: post.id,
        isApproved: true,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
