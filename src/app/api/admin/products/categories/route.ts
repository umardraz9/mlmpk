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

    // Get categories from Supabase
    const categories = await getProductCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Create category in Supabase
    const newCategory = await createProductCategory({
      name,
      color: color || '#3B82F6'
    });

    console.log('Category created in Supabase:', newCategory);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating product category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
