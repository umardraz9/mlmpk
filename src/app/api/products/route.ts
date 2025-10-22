import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/supabase-products';

// GET - List all active products for public access
export async function GET(request: NextRequest) {
  try {
    console.log('Products API called');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search');

    // Get products from Supabase
    const result = await getProducts({
      page,
      limit,
      status: 'ACTIVE', // Only show active products to users
      search,
      categoryId: categoryId && categoryId !== 'all' ? categoryId : undefined
    });

    console.log(`Returning ${result.products.length} products, total: ${result.total}`);

    return NextResponse.json({
      success: true,
      products: result.products.map(product => ({
        ...product,
        originalPrice: product.comparePrice,
        discountPercentage: product.comparePrice 
          ? Math.round((product.comparePrice - product.price) / product.comparePrice * 100)
          : 0,
        images: typeof product.images === 'string' 
          ? JSON.parse(product.images || '[]')
          : product.images || [],
        stock: product.quantity,
        rating: product.rating || 4.5,
        reviewCount: product.reviewCount || 0,
        category: product.categoryId
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        totalCount: result.total,
        totalPages: result.totalPages,
        hasNext: page < result.totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load products' },
      { status: 500 }
    );
  }
} 