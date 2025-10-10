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
    
    const cacheKey = 'featured-products';
    const ttl = forceRefresh ? 0 : 300; // 5 minutes cache, or no cache if force refresh
    
    const products = await queryWithCache(
      cacheKey,
      async () => {
        return await prisma.product.findMany({
          where: {
            trending: true,
            status: 'ACTIVE'
          },
          take: 6, // Increased for better variety
          orderBy: [
            { rating: 'desc' },
            { sales: 'desc' },
            { createdAt: 'desc' }
          ],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            comparePrice: true,
            images: true,
            category: true,
            rating: true,
            reviewCount: true,
            sales: true,
            createdAt: true
          },
        });
      },
      ttl
    );
    
    // Enhanced image handling with fallbacks
    const featuredProducts = products.map(product => {
      let imageUrl = product.images;
      
      // Handle different image formats
      if (!imageUrl || imageUrl === 'placeholder') {
        // Use category-specific placeholder
        const category = product.category?.toLowerCase() || 'general';
        imageUrl = `/images/products/${category}-placeholder.svg`;
      } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        // Ensure proper path for local images
        imageUrl = `/images/products/${imageUrl}`;
      }
      
      return {
        ...product,
        images: imageUrl,
        // Add computed fields for better UX
        discountPercentage: product.comparePrice 
          ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
          : 0,
        isNew: product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };
    });
    
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
    
    return NextResponse.json(featuredProducts, { headers });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    
    // Enhanced error response
    const errorResponse = {
      error: 'Failed to fetch featured products',
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
