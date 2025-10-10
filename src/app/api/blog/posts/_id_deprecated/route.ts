import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/blog/posts/[id] - Get a single blog post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        author: true,
        tags: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

// PUT /api/blog/posts/[id] - Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role (you might have different role checks)
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if post exists
    const existingPost = await db.blogPost.findUnique({
      where: {
        id,
      },
      include: {
        tags: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const data = await request.json();
    
    // Prepare data for update
    const updateData: any = {
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      categoryId: data.categoryId,
      status: data.status,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      featuredImage: data.featuredImage,
      isCommentingEnabled: data.isCommentingEnabled,
    };

    // Add publishedAt date if status is changing to PUBLISHED
    if (data.status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    // Update the post
    const post = await db.blogPost.update({
      where: {
        id,
      },
      data: {
        ...updateData,
        // Handle tags update if provided
        ...(data.tags
          ? {
              tags: {
                set: [], // Clear existing tags
                connect: data.tags.map((id: string) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        category: true,
        author: true,
        tags: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/posts/[id] - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role (you might have different role checks)
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if post exists
    const existingPost = await db.blogPost.findUnique({
      where: {
        id,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Delete the post
    await db.blogPost.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: 'Blog post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
} 