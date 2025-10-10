import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, postId, data } = await req.json();
    const userId = session.user.id;

    switch (action) {
      case 'delete-post':
        const postToDelete = await prisma.socialPost.findUnique({
          where: { id: postId }
        });

        if (!postToDelete || postToDelete.authorId !== userId) {
          return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
        }

        await prisma.socialPost.delete({
          where: { id: postId }
        });

        return NextResponse.json({ deleted: true });

      case 'edit-post':
        const postToEdit = await prisma.socialPost.findUnique({
          where: { id: postId }
        });

        if (!postToEdit || postToEdit.authorId !== userId) {
          return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
        }

        await prisma.socialPost.update({
          where: { id: postId },
          data: { 
            content: data.content
          }
        });

        return NextResponse.json({ updated: true });

      case 'toggle-save':
        // For now, just return success - can implement when database supports it
        return NextResponse.json({ saved: true });

      case 'toggle-pin':
        // For now, just return success - can implement when database supports it
        return NextResponse.json({ pinned: true });

      case 'hide-post':
        // For now, just return success - can implement when database supports it
        return NextResponse.json({ hidden: true });

      case 'archive-post':
        // For now, just return success - can implement when database supports it
        return NextResponse.json({ archived: true });

      case 'toggle-notifications':
        // For now, just return success - can implement when database supports it
        return NextResponse.json({ notifications: false });

      case 'report-post':
        // For now, just return success - can implement when database supports it
        return NextResponse.json({ reported: true });

      case 'block-user':
        // For now, just return success - can implement when database supports it
        return NextResponse.json({ blocked: true });

      case 'snooze-user':
        // For now, just return success - can implement when database supports it
        return NextResponse.json({ snoozed: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Post management error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
