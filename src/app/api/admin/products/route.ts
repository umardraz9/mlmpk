import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getProducts, createProduct } from '@/lib/supabase-products';

// GET - List all products
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    if (!(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    // Get products from Supabase
    const result = await getProducts({
      page,
      limit,
      status,
      search
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new product (Mock implementation)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    if (!(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.description || !data.price || !data.categoryId) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, description, price, categoryId' 
      }, { status: 400 });
    }

    // Create product in Supabase
    const newProduct = await createProduct({
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
      costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
      sku: data.sku || null,
      barcode: data.barcode || null,
      trackQuantity: data.trackQuantity || false,
      quantity: data.trackQuantity ? parseInt(data.quantity) || 0 : 0,
      minQuantity: data.trackQuantity ? parseInt(data.minQuantity) || 0 : 0,
      status: data.status || 'DRAFT',
      scheduledAt: data.scheduledAt || null,
      categoryId: data.categoryId,
      weight: data.weight ? parseFloat(data.weight) : null,
      dimensions: data.dimensions || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      metaKeywords: data.metaKeywords || null,
      images: data.images || [],
      tags: data.tags || []
    });

    console.log('Product created in Supabase:', newProduct);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 