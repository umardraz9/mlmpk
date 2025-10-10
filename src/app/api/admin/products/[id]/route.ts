import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const product = await db.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Parse JSON fields
    const productWithParsedFields = {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      dimensions: product.dimensions ? JSON.parse(product.dimensions) : null,
      tags: product.tags ? JSON.parse(product.tags) : []
    };

    return NextResponse.json(productWithParsedFields);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      comparePrice,
      costPrice,
      sku,
      barcode,
      trackQuantity,
      quantity,
      minQuantity,
      status,
      scheduledAt,
      images = [],
      weight,
      dimensions,
      category,
      tags = [],
      metaTitle,
      metaDescription,
      metaKeywords
    } = body;

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Generate new slug if name changed
    let slug = existingProduct.slug;
    if (name && name !== existingProduct.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug already exists
      const slugConflict = await db.product.findUnique({
        where: { slug }
      });

      if (slugConflict && slugConflict.id !== id) {
        return NextResponse.json({ 
          error: 'A product with this name already exists' 
        }, { status: 400 });
      }
    }

    // Check if SKU already exists
    if (sku && sku !== existingProduct.sku) {
      const existingSku = await db.product.findUnique({
        where: { sku }
      });

      if (existingSku && existingSku.id !== id) {
        return NextResponse.json({ 
          error: 'A product with this SKU already exists' 
        }, { status: 400 });
      }
    }

    // Update product
    const product = await db.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        price,
        comparePrice,
        costPrice,
        sku,
        barcode,
        trackQuantity,
        quantity,
        minQuantity,
        status,
        scheduledAt: status === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt) : null,
        images: JSON.stringify(images),
        weight,
        dimensions: dimensions ? JSON.stringify(dimensions) : null,
        category,
        tags: JSON.stringify(tags),
        metaTitle,
        metaDescription,
        metaKeywords
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete product
    await db.product.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 