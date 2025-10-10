import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Create a robust slug from a title. If the title looks like a URL, extract the last path segment.
function slugifyTitle(input: string): string {
  try {
    const trimmed = (input || '').trim();
    let base = trimmed;

    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      const segments = url.pathname.split('/').filter(Boolean);
      base = segments.length > 0 ? segments[segments.length - 1] : url.hostname;
    }

    const slug = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return slug || 'post';
  } catch {
    return (input || 'post')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'post';
  }
}

// GET - Get single blog post by slug (for editing)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;

    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        category: {
          select: { id: true, name: true, slug: true, color: true }
        },
        tags: {
          select: { id: true, name: true, slug: true, color: true }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update blog post by slug
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      featuredImage,
      status,
      scheduledAt,
      categoryId,
      tags = [],
      metaTitle,
      metaDescription,
      metaKeywords
    } = body;

    // Validate required fields
    if (!title || !content || !categoryId) {
      return NextResponse.json({ 
        error: 'Title, content, and category are required' 
      }, { status: 400 });
    }

    // Check if post exists
    const existingPost = await db.blogPost.findUnique({
      where: { slug }
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Generate new slug if title changed
    let newSlug = slug;
    if (title !== existingPost.title) {
      newSlug = slugifyTitle(title);

      // Check if new slug already exists
      const slugExists = await db.blogPost.findUnique({
        where: { slug: newSlug }
      });

      if (slugExists && slugExists.id !== existingPost.id) {
        return NextResponse.json({ 
          error: 'A post with this title already exists' 
        }, { status: 400 });
      }
    }

    // Update blog post
    const post = await db.blogPost.update({
      where: { slug },
      data: {
        title,
        slug: newSlug,
        content,
        excerpt,
        featuredImage,
        status,
        categoryId,
        metaTitle,
        metaDescription,
        metaKeywords,
        publishedAt: status === 'PUBLISHED' && !existingPost.publishedAt ? new Date() : existingPost.publishedAt,
        scheduledAt: status === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt) : null,
        tags: {
          set: [], // Clear existing tags
          connect: tags.map((tagId: string) => ({ id: tagId }))
        }
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        category: {
          select: { id: true, name: true, slug: true, color: true }
        },
        tags: {
          select: { id: true, name: true, slug: true, color: true }
        }
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete blog post by slug
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;

    // Check if post exists
    const existingPost = await db.blogPost.findUnique({
      where: { slug }
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete the post
    await db.blogPost.delete({
      where: { slug }
    });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
