import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get('alertType') || 'all';
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build where clause for inventory alerts
    const where: any = {
      trackQuantity: true,
      status: { in: ['ACTIVE', 'PUBLISHED'] }
    };

    if (alertType === 'low_stock') {
      where.quantity = { lte: 10 };
    } else if (alertType === 'out_of_stock') {
      where.quantity = { lte: 0 };
    } else if (alertType === 'overstocked') {
      where.quantity = { gte: 100 };
    }

    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } }
      ];
    }

    // Get inventory data
    const [
      inventoryItems,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      overstockedCount,
      totalValue,
      categories
    ] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { quantity: 'asc' },
        include: {
          category: {
            select: {
              name: true,
              color: true
            }
          }
        }
      }),

      prisma.product.count({
        where: { 
          trackQuantity: true,
          status: { in: ['ACTIVE', 'PUBLISHED'] }
        }
      }),

      prisma.product.count({
        where: {
          trackQuantity: true,
          quantity: { lte: 10, gt: 0 },
          status: { in: ['ACTIVE', 'PUBLISHED'] }
        }
      }),

      prisma.product.count({
        where: {
          trackQuantity: true,
          quantity: { lte: 0 },
          status: { in: ['ACTIVE', 'PUBLISHED'] }
        }
      }),

      prisma.product.count({
        where: {
          trackQuantity: true,
          quantity: { gte: 100 },
          status: { in: ['ACTIVE', 'PUBLISHED'] }
        }
      }),

      prisma.product.aggregate({
        _sum: {
          quantity: true
        },
        where: {
          trackQuantity: true,
          status: { in: ['ACTIVE', 'PUBLISHED'] }
        }
      }),

      prisma.productCategory.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          color: true
        }
      })
    ]);

    // Calculate inventory value (assuming cost price or regular price)
    const inventoryValue = inventoryItems.reduce((total, item) => {
      const price = item.costPrice || item.price;
      return total + (price * item.quantity);
    }, 0);

    const analytics = {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      overstockedCount,
      totalQuantity: totalValue._sum.quantity || 0,
      inventoryValue,
      categories
    };

    return NextResponse.json({
      inventoryItems,
      analytics
    });
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update inventory quantities
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity, reason, type } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json({ 
        error: 'Product ID and quantity are required' 
      }, { status: 400 });
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let newQuantity = quantity;
    
    // Handle different update types
    if (type === 'add') {
      newQuantity = product.quantity + quantity;
    } else if (type === 'subtract') {
      newQuantity = Math.max(0, product.quantity - quantity);
    }

    // Update product quantity
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { 
        quantity: newQuantity,
        updatedAt: new Date()
      }
    });

    // Log inventory change
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'INVENTORY_UPDATE',
        amount: 0,
        description: `Inventory ${type || 'update'}: ${product.name} - ${reason || 'Manual adjustment'}`,
        status: 'COMPLETED',
        reference: `INV-${productId}-${Date.now()}`
      }
    });

    return NextResponse.json({
      message: 'Inventory updated successfully',
      product: updatedProduct,
      previousQuantity: product.quantity,
      newQuantity
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
