import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session'
// @ts-expect-error - NextAuth getServerSession import issue
;
;
import { db as prisma } from '@/lib/db';

// POST - Toggle save (favorite) for a post
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const postId = params.id;

    // Ensure post exists and is active
    const post = await prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existing = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        targetId: postId,
        type: 'POST',
      },
      select: { id: true },
    });

    let isSaved = false;
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      isSaved = false;
    } else {
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          type: 'POST',
          targetId: postId,
        },
      });
      isSaved = true;
    }

    const message = isSaved ? 'Save post successfully' : 'Remove from saved successfully';
    return NextResponse.json({ success: true, isSaved, message });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 });
  }
}
