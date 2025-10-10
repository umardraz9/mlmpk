import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/blog/posts/[slug] - Get a single blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Fetch the blog post by slug
    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tags: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await db.blogPost.update({
      where: { id: post.id },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    // Fetch derived counts
    const [commentsCount, bookmarksCount] = await Promise.all([
      db.blogComment.count({ where: { postId: post.id, isApproved: true } }),
      db.favorite.count({ where: { targetId: post.id, type: 'ARTICLE' } }),
    ]);

    // Transform the data to match the frontend interface
    const transformedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      featuredImage: post.featuredImage || 'https://images.unsplash.com/photo-1553484771-371a605b060b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      author: {
        id: post.author.id,
        name: post.author.name || 'Unknown Author',
        avatar: post.author.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name || 'User')}&background=10b981&color=fff`,
        bio: 'Content Creator',
        verified: true,
        level: 5,
      },
      category: {
        id: post.category?.id,
        name: post.category?.name || 'Uncategorized',
        slug: post.category?.slug || 'uncategorized',
        color: 'bg-blue-500',
      },
      tags: post.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      publishedAt: post.publishedAt || post.createdAt,
      readTime: Math.ceil((post.content?.length || 0) / 1000), // Rough estimate: 1000 chars = 1 min
      views: post.views || 0,
      likes: post.likes || 0,
      comments: commentsCount,
      bookmarks: bookmarksCount,
      isLiked: false,
      isBookmarked: false,
      featured: false,
      type: 'article',
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}
