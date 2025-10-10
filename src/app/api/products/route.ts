import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

// GET - List all active products for public access
export async function GET(request: NextRequest) {
  try {
    console.log('Products API called');
    
    // Import prisma client
    const { prisma } = await import('@/lib/prisma');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause - show ACTIVE and PUBLISHED products to public
    const where: Prisma.ProductWhereInput = { status: { in: ['ACTIVE', 'PUBLISHED'] } };

    const andFilters: Prisma.ProductWhereInput[] = [];
    
    if (category && category !== 'all') {
      // Accept categoryId, or match by slug, or fuzzy match by name (case-insensitive)
      andFilters.push({
        OR: [
          { categoryId: category },
          { category: { is: { slug: category } } },
          { category: { is: { name: { contains: category } } } }
        ]
      });
    }
    
    if (search) {
      andFilters.push({
        OR: [
          { name: { contains: search } },
          { description: { contains: search } }
        ]
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    console.log('Querying database with where:', where);

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          comparePrice: true,
          images: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          },
          tags: true,
          quantity: true,
          trackQuantity: true,
          status: true,
          trending: true,
          rating: true,
          reviewCount: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.product.count({ where })
    ]);

    console.log(`Found ${products.length} products`);

    // Parse fields for frontend consumption
    const productsWithParsedFields = products.map(product => {
      let images: string[] = [];
      let tags: string | string[] = '';
      
      // Handle images field
      if (product.images) {
        try {
          if (product.images.startsWith('[')) {
            images = JSON.parse(product.images);
          } else {
            images = [product.images];
          }
        } catch {
          images = [product.images];
        }
      }
      // Sanitize images: keep only valid absolute/relative URLs
      const isValidUrl = (u: unknown) => typeof u === 'string'
        && u.trim().length > 0
        && (u.startsWith('/') || u.startsWith('http://') || u.startsWith('https://'))
        && u !== '[]'
        && u !== '"[]"';
      images = Array.isArray(images) ? images.filter(isValidUrl) : [];
      
      // Handle tags field - return as string to match frontend expectations
      if (product.tags) {
        // Ensure tags is always a string
        tags = typeof product.tags === 'string' ? product.tags : String(product.tags);
      }
      
      return {
        ...product,
        images,
        tags,
        inStock: product.trackQuantity ? product.quantity > 0 : true,
        stockCount: product.quantity || 0
      };
    });

    return NextResponse.json({
      products: productsWithParsedFields,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 