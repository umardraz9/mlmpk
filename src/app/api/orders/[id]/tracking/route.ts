import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db as prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
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
        userId: session.user.id
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate mock tracking data based on order status
    const generateTrackingEvents = (status: string, createdAt: Date) => {
      const events = [];
      const baseTime = new Date(createdAt);

      // Order Confirmed
      events.push({
        id: '1',
        status: 'CONFIRMED',
        description: 'Order confirmed and payment received',
        location: 'MCNmart Warehouse, Karachi',
        timestamp: baseTime.toISOString(),
        isCompleted: true
      });

      if (['PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
        events.push({
          id: '2',
          status: 'PROCESSING',
          description: 'Order is being prepared for shipment',
          location: 'MCNmart Warehouse, Karachi',
          timestamp: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
          isCompleted: true
        });
      }

      if (['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
        events.push({
          id: '3',
          status: 'SHIPPED',
          description: 'Package shipped and in transit',
          location: 'Karachi Distribution Center',
          timestamp: new Date(baseTime.getTime() + 24 * 60 * 60 * 1000).toISOString(), // +1 day
          isCompleted: true
        });
      }

      if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
        events.push({
          id: '4',
          status: 'OUT_FOR_DELIVERY',
          description: 'Package out for delivery',
          location: `${order.shippingCity || 'City'} Delivery Hub`,
          timestamp: new Date(baseTime.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2 days
          isCompleted: true
        });
      }

      if (status === 'DELIVERED') {
        events.push({
          id: '5',
          status: 'DELIVERED',
          description: 'Package delivered successfully',
          location: order.shippingAddress || 'Delivery Address',
          timestamp: new Date(baseTime.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 days
          isCompleted: true
        });
      }

      return events.reverse(); // Show latest first
    };

    const getCurrentLocation = (status: string) => {
      switch (status) {
        case 'CONFIRMED':
          return 'MCNmart Warehouse, Karachi';
        case 'PROCESSING':
          return 'MCNmart Warehouse, Karachi';
        case 'SHIPPED':
          return 'In Transit to ' + (order.shippingCity || 'Your City');
        case 'OUT_FOR_DELIVERY':
          return (order.shippingCity || 'Your City') + ' Delivery Hub';
        case 'DELIVERED':
          return 'Delivered to ' + (order.shippingAddress || 'Your Address');
        default:
          return 'Processing Center';
      }
    };

    const trackingData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber || `MCN${order.orderNumber}`,
      currentLocation: getCurrentLocation(order.status),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      shippingAddress: {
        fullName: order.shippingName || 'Customer',
        address: order.shippingAddress || 'Address',
        city: order.shippingCity || 'City',
        phone: order.shippingPhone || 'Phone'
      },
      trackingEvents: generateTrackingEvents(order.status, order.createdAt),
      courierName: 'MCNmart Express',
      courierPhone: '+92-300-1234567'
    };

    return NextResponse.json({
      success: true,
      tracking: trackingData
    });

  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
