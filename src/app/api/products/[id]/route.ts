import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    console.log('Fetching product:', productIdOrSlug);

    // Try by ID first
    let { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productIdOrSlug)
      .single();

    // If not found by ID, try by slug
    if (!product && !error) {
      const { data: slugProduct } = await supabase
        .from('products')
        .select('*')
        .eq('slug', productIdOrSlug)
        .single();
      product = slugProduct;
    }

    if (!product) {
      console.warn('Product not found:', productIdOrSlug);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Only show active/published products to public
    if (!['ACTIVE', 'PUBLISHED', 'DRAFT'].includes(product.status)) {
      return NextResponse.json({ error: 'Product not available' }, { status: 404 });
    }

    // Parse images and tags
    let images: string[] = [];
    let tags: string[] = [];

    if (product.images) {
      try {
        if (typeof product.images === 'string') {
          if (product.images.startsWith('[')) {
            images = JSON.parse(product.images);
          } else {
            images = [product.images];
          }
        } else if (Array.isArray(product.images)) {
          images = product.images;
        }
      } catch {
        images = typeof product.images === 'string' ? [product.images] : [];
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
        if (typeof product.tags === 'string') {
          if (product.tags.startsWith('[')) {
            tags = JSON.parse(product.tags);
          } else if (product.tags.includes(',')) {
            tags = product.tags.split(',').map(tag => tag.trim());
          } else {
            tags = [product.tags];
          }
        } else if (Array.isArray(product.tags)) {
          tags = product.tags;
        }
      } catch {
        tags = typeof product.tags === 'string' ? [product.tags] : [];
      }
    }

    const productWithParsedFields = {
      ...product,
      images,
      tags,
      category: product.categoryId || 'Uncategorized',
      inStock: product.trackQuantity ? product.quantity > 0 : true,
      stockCount: product.quantity || 0,
      // Add some mock data for better display
      rating: product.rating || 4.5,
      reviewCount: product.reviewCount || Math.floor(Math.random() * 200) + 50,
      discount: product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : null
    };

    console.log('Product fetched successfully:', product.id);
    return NextResponse.json({ product: productWithParsedFields });
  } catch (error: any) {
    console.error('Error fetching product:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  }
}
