import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import type { Session } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: session.user.id as string
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse product images
    const orderWithParsedImages = {
      ...order,
      items: order.items.map(item => {
        let images = ['/api/placeholder/80/80']; // Default fallback
        
        try {
          if (item.product.images) {
            if (item.product.images.startsWith('[')) {
              const parsed = JSON.parse(item.product.images);
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
                images = parsed.filter(img => img && img !== '');
              }
            } else if (item.product.images !== '[]' && item.product.images !== '') {
              images = [item.product.images];
            }
          }
        } catch {
          // Keep default fallback
        }
        
        // Ensure we always have at least one valid image
        if (!images.length || !images[0]) {
          images = ['/api/placeholder/80/80'];
        }

        return {
          ...item,
          product: {
            ...item.product,
            images
          }
        };
      })
    };

    return NextResponse.json({
      success: true,
      order: orderWithParsedImages
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
