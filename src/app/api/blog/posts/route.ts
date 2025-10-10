import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

// GET /api/blog/posts - Get all blog posts (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('category');
    const tagId = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build the where clause based on filters
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (tagId) {
      where.tags = {
        some: {
          id: tagId,
        },
      };
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy: {
          publishedAt: 'desc',
        },
        include: {
          category: true,
          author: true,
          tags: true,
        },
        skip,
        take: limit,
      }),
      db.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

// POST /api/blog/posts - Create a new blog post
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.content || !data.categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.title);
    }

    // Prepare data for creation
    const postData = {
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      categoryId: data.categoryId,
      authorId: session.user.id,
      status: data.status || 'DRAFT',
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      featuredImage: data.featuredImage,
      isCommentingEnabled: data.isCommentingEnabled !== false,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    };

    // Create the post
    const post = await db.blogPost.create({
      data: {
        ...postData,
        // Connect tags if provided
        ...(data.tags && data.tags.length > 0
          ? {
              tags: {
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

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
} 