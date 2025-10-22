import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session'
;
;
import { db as prisma } from '@/lib/db';

// PATCH - Update post privacy settings
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
    const { visibility } = await request.json();
    
    // Valid visibility options: public, followers, private
    const validVisibility = ['public', 'followers', 'private'];
    if (!validVisibility.includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility setting' }, { status: 400 });
    }

    // Check if post exists and user owns it
    const post = await prisma.socialPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to modify this post' }, { status: 403 });
    }

    // Update post privacy
    const updatedPost = await prisma.socialPost.update({
      where: { id: postId },
      data: { status: visibility }
    });

    return NextResponse.json({
      success: true,
      visibility: visibility,
      message: `Post privacy updated to ${visibility}`
    });

  } catch (error) {
    console.error('Error updating post privacy:', error);
    return NextResponse.json({
      error: 'Failed to update post privacy',
      details: error.message
    }, { status: 500 });
  }
}
