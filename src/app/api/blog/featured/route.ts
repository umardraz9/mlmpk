import { NextResponse } from 'next/server';
import { prisma, queryWithCache } from '@/lib/db-pool';

// Enhanced caching configuration
export const revalidate = 300; // 5 minutes
export const dynamic = 'force-dynamic'; // Ensure fresh data when needed

export async function GET(request: Request) {
  try {
    // Extract cache-busting parameter if present
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    const cacheKey = 'featured-blog-posts';
    const ttl = forceRefresh ? 0 : 300; // 5 minutes cache, or no cache if force refresh
    
    const posts = await queryWithCache(
      cacheKey,
      async () => {
        return await prisma.blogPost.findMany({
          where: {
            status: 'PUBLISHED'
          },
          take: 6, // Increased for better variety
          orderBy: [
            { publishedAt: 'desc' },
            { views: 'desc' },
            { likes: 'desc' }
          ],
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            featuredImage: true,
            publishedAt: true,
            views: true,
            likes: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                avatar: true
              },
            },
            category: {
              select: {
                name: true,
                slug: true
              },
            },
            tags: {
              select: {
                name: true,
                slug: true
              },
              take: 3
            }
          },
        });
      },
      ttl
    );
    
    // Enhanced image handling with fallbacks
    const featuredPosts = posts.map(post => {
      let imageUrl = post.featuredImage;
      
      // Map blog post titles to existing images
      const imageMapping = {
        'success-story-1.jpg': 'ecommerce-pakistan.jpg',
        'beginners-guide.jpg': 'digital-lifestyle.jpg', 
        'daily-habits.jpg': 'passive-income.jpg',
        'course-review.jpg': 'ecommerce-pakistan.jpg',
        'team-building.jpg': 'digital-lifestyle.jpg'
      };
      
      // Handle different image formats
      if (!imageUrl || imageUrl === 'placeholder') {
        // Use category-specific placeholder
        const category = post.category?.slug || 'general';
        imageUrl = `/images/blog/${category}-placeholder.svg`;
      } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        // Check if we need to map to existing image
        const filename = imageUrl.split('/').pop() || imageUrl;
        const mappedImage = imageMapping[filename] || filename;
        imageUrl = `/images/blog/${mappedImage}`;
      }
      
      return {
        ...post,
        featuredImage: imageUrl,
        // Add computed fields for better UX
        readingTime: Math.ceil((post.excerpt?.length || 0) / 200), // Rough estimate
        isNew: post.createdAt && new Date(post.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        engagement: post.views + post.likes * 5 // Simple engagement score
      };
    });
    
    // Sort by engagement for better content discovery
    featuredPosts.sort((a, b) => b.engagement - a.engagement);
    
    // Enhanced response headers for better caching
    const headers = {
      'Cache-Control': forceRefresh 
        ? 'no-cache, no-store, must-revalidate'
        : 'public, s-maxage=300, stale-while-revalidate=600, max-age=60',
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Cache-Status': forceRefresh ? 'MISS' : 'HIT'
    };
    
    return NextResponse.json(featuredPosts, { headers });
  } catch (error) {
    console.error('Error fetching featured blog posts:', error);
    
    // Enhanced error response
    const errorResponse = {
      error: 'Failed to fetch featured blog posts',
      message: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error')
        : 'Internal server error',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}
