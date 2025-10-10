import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// PUT - Update shipping information for an order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { 
      trackingNumber, 
      courierService, 
      estimatedDelivery, 
      shippingNotes,
      status 
    } = body;

    // Validate required fields
    if (!trackingNumber || !courierService) {
      return NextResponse.json({ 
        error: 'Tracking number and courier service are required' 
      }, { status: 400 });
    }

    // Update order with shipping information
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber,
        status: status || 'SHIPPED',
        notes: shippingNotes || null,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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

    // Create shipping tracking record
    await prisma.shippingTracking.create({
      data: {
        orderId: id,
        trackingNumber,
        courierService,
        status: 'SHIPPED',
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        notes: shippingNotes,
        trackingEvents: JSON.stringify([
          {
            timestamp: new Date().toISOString(),
            status: 'SHIPPED',
            location: 'Warehouse',
            description: `Package shipped via ${courierService}`,
            courierService
          }
        ])
      }
    });

    // Create notification for customer
    await prisma.notification.create({
      data: {
        title: 'Order Shipped!',
        message: `Your order ${updatedOrder.orderNumber} has been shipped via ${courierService}. Tracking: ${trackingNumber}`,
        type: 'success',
        category: 'shipping',
        recipientId: updatedOrder.userId,
        data: JSON.stringify({
          orderId: id,
          orderNumber: updatedOrder.orderNumber,
          trackingNumber,
          courierService,
          estimatedDelivery
        }),
        actionUrl: `/orders/${id}/tracking`,
        actionText: 'Track Package'
      }
    });

    return NextResponse.json({
      message: 'Shipping information updated successfully',
      order: updatedOrder,
      trackingNumber
    });

  } catch (error) {
    console.error('Error updating shipping information:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get shipping tracking information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get order with shipping information
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user owns the order or is admin
    if (order.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shipping tracking information
    const shippingTracking = await prisma.shippingTracking.findUnique({
      where: { orderId: id }
    });

    let trackingEvents = [];
    if (shippingTracking?.trackingEvents) {
      try {
        trackingEvents = JSON.parse(shippingTracking.trackingEvents);
      } catch (e) {
        trackingEvents = [];
      }
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber,
        totalPkr: order.totalPkr,
        createdAt: order.createdAt
      },
      shipping: shippingTracking ? {
        trackingNumber: shippingTracking.trackingNumber,
        courierService: shippingTracking.courierService,
        status: shippingTracking.status,
        estimatedDelivery: shippingTracking.estimatedDelivery,
        trackingEvents,
        lastUpdated: shippingTracking.updatedAt
      } : null
    });

  } catch (error) {
    console.error('Error fetching shipping information:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
