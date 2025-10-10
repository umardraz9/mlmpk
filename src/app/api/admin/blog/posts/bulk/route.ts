import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Bulk operations on blog posts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, postIds } = body;

    if (!action || !postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ 
        error: 'Action and post IDs are required' 
      }, { status: 400 });
    }

    // Validate that all posts exist and belong to the current user or user is admin
    const existingPosts = await db.blogPost.findMany({
      where: { 
        id: { in: postIds }
      },
      select: { id: true, title: true }
    });

    if (existingPosts.length !== postIds.length) {
      return NextResponse.json({ 
        error: 'Some posts were not found' 
      }, { status: 404 });
    }

    let result;

    if (action === 'delete') {
      // Bulk delete posts
      result = await db.blogPost.deleteMany({
        where: { id: { in: postIds } }
      });
    } else {
      // Bulk status update
      const validStatuses = ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'];
      if (!validStatuses.includes(action)) {
        return NextResponse.json({ 
          error: 'Invalid status' 
        }, { status: 400 });
      }

      const updateData: any = { 
        status: action 
      };

      // Set publishedAt for PUBLISHED status
      if (action === 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }

      result = await db.blogPost.updateMany({
        where: { id: { in: postIds } },
        data: updateData
      });
    }

    return NextResponse.json({ 
      message: `Successfully ${action === 'delete' ? 'deleted' : 'updated'} ${result.count} posts`,
      count: result.count
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 