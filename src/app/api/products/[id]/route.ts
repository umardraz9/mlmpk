import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

// GET - Get single product details for quick view
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productIdOrSlug = params.id;

    if (!productIdOrSlug) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Try by ID first, then by slug for compatibility with links using either
    let product = await prisma.product.findUnique({
      where: { id: productIdOrSlug },
      include: {
        category: {
          select: { id: true, name: true, slug: true, color: true }
        }
      }
    });
    if (!product) {
      product = await prisma.product.findUnique({
        where: { slug: productIdOrSlug },
        include: {
          category: {
            select: { id: true, name: true, slug: true, color: true }
          }
        }
      });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Only show active/published products to public
    if (!['ACTIVE', 'PUBLISHED'].includes(product.status)) {
      return NextResponse.json({ error: 'Product not available' }, { status: 404 });
    }

    // Parse images and tags
    let images: string[] = [];
    let tags: string[] = [];

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
    // Sanitize images array: valid absolute or site-relative URLs only
    const isValidUrl = (u: unknown) => typeof u === 'string'
      && u.trim().length > 0
      && (u.startsWith('/') || u.startsWith('http://') || u.startsWith('https://'))
      && u !== '[]'
      && u !== '"[]"';
    images = Array.isArray(images) ? images.filter(isValidUrl) : [];

    if (product.tags) {
      try {
        if (product.tags.startsWith('[')) {
          tags = JSON.parse(product.tags);
        } else if (product.tags.includes(',')) {
          tags = product.tags.split(',').map(tag => tag.trim());
        } else {
          tags = [product.tags];
        }
      } catch {
        tags = product.tags ? [product.tags] : [];
      }
    }

    const productWithParsedFields = {
      ...product,
      images,
      tags,
      category: product.category?.name || 'Uncategorized',
      inStock: product.trackQuantity ? product.quantity > 0 : true,
      stockCount: product.quantity || 0,
      // Add some mock data for better display
      rating: 4.5,
      reviewCount: Math.floor(Math.random() * 200) + 50,
      discount: product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : null
    };

    return NextResponse.json({ product: productWithParsedFields });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
