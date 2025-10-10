import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Create a robust slug from a title. If the title looks like a URL, extract the last path segment.
function slugifyTitle(input: string): string {
  try {
    const trimmed = (input || '').trim();
    let base = trimmed;

    // If input is a URL, try to parse and take the last non-empty pathname segment
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
    // Fallback to simple slugify
    return (input || 'post')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'post';
  }
}

// GET - List all blog posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { excerpt: { contains: search } }
      ];
    }

    const [posts, totalCount] = await Promise.all([
      db.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          category: {
            select: { id: true, name: true, slug: true, color: true }
          },
          tags: {
            select: { id: true, name: true, slug: true, color: true }
          },
          _count: {
            select: { comments: true }
          }
        }
      }),
      db.blogPost.count({ where })
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      featuredImage,
      status = 'DRAFT',
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

    // Generate slug from title (supports titles pasted as full URLs)
    const slug = slugifyTitle(title);

    // Check if slug already exists
    const existingPost = await db.blogPost.findUnique({
      where: { slug }
    });

    if (existingPost) {
      return NextResponse.json({ 
        error: 'A post with this title already exists' 
      }, { status: 400 });
    }

    // Create blog post
    const post = await db.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status,
        authorId: session.user.id,
        categoryId,
        metaTitle,
        metaDescription,
        metaKeywords,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        scheduledAt: status === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt) : null,
        tags: {
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

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 