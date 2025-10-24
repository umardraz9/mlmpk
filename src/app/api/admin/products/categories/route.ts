import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getProductCategories, createProductCategory } from '@/lib/supabase-products';

// GET /api/admin/products/categories - Get all product categories
export async function GET() {
  try {
    const session = await requireAuth();
    
    if (!(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching product categories...');
    // Get categories from Supabase
    const categories = await getProductCategories();
    console.log('Categories fetched:', categories?.length || 0);
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error fetching product categories:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message
    }, { status: 500 });
  }
}

// POST /api/admin/products/categories - Create new product category
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    if (!(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, color } = await request.json();

    if (!name || typeof name !== 'string') {
      console.warn('Invalid category name:', name);
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    console.log('Creating category:', { name, color });
    // Create category in Supabase
    const newCategory = await createProductCategory({
      name,
      color: color || '#3B82F6'
    });

    console.log('Category created successfully:', newCategory?.id);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product category:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message
    }, { status: 500 });
  }
}
