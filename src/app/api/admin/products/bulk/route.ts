import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Bulk operations on products
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, productIds } = body;

    if (!action || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ 
        error: 'Action and product IDs are required' 
      }, { status: 400 });
    }

    // Validate that all products exist
    const existingProducts = await db.product.findMany({
      where: { 
        id: { in: productIds }
      },
      select: { id: true, name: true }
    });

    if (existingProducts.length !== productIds.length) {
      return NextResponse.json({ 
        error: 'Some products were not found' 
      }, { status: 404 });
    }

    let result;

    if (action === 'delete') {
      // Bulk delete products
      result = await db.product.deleteMany({
        where: { id: { in: productIds } }
      });
    } else {
      // Bulk status update
      const validStatuses = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];
      if (!validStatuses.includes(action)) {
        return NextResponse.json({ 
          error: 'Invalid status' 
        }, { status: 400 });
      }

      result = await db.product.updateMany({
        where: { id: { in: productIds } },
        data: { 
          status: action 
        }
      });
    }

    return NextResponse.json({ 
      message: `Successfully ${action === 'delete' ? 'deleted' : 'updated'} ${result.count} products`,
      count: result.count
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 