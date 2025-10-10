import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db as prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { type, orderId, phone } = await request.json();

    if (!type || !orderId || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get order details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create SMS notification record
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'SMS',
        title: 'Order SMS Notification',
        message: `SMS sent to ${phone} for order #${order.orderNumber}`,
        metadata: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          phone: phone,
          notificationType: type
        }),
        isRead: false
      }
    });

    // In a real application, you would integrate with SMS services like:
    // - Twilio
    // - AWS SNS
    // - Local SMS gateway providers in Pakistan
    // 
    // For now, we'll simulate the SMS sending
    console.log(`Sending ${type} SMS to ${phone} for order ${order.orderNumber}`);
    
    // Simulate SMS content based on type
    let smsContent = '';
    switch (type) {
      case 'order_confirmation':
        smsContent = `MCNmart: Your order #${order.orderNumber} confirmed! Total: PKR ${order.totalAmount.toLocaleString()}. We'll update you when it ships. Thanks for shopping with us!`;
        break;
      case 'order_shipped':
        smsContent = `MCNmart: Your order #${order.orderNumber} has shipped! Track: ${order.trackingNumber || 'TBD'}. Expected delivery in 2-3 days.`;
        break;
      case 'order_delivered':
        smsContent = `MCNmart: Your order #${order.orderNumber} delivered! Hope you love it. Please rate your experience. Thank you!`;
        break;
    }

    // Log the SMS content (in production, this would be sent via SMS service)
    console.log('SMS Content:', smsContent);

    return NextResponse.json({
      success: true,
      message: 'SMS notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS notification' },
      { status: 500 }
    );
  }
}
