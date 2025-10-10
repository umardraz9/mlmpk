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

    const { type, orderId, email } = await request.json();

    if (!type || !orderId || !email) {
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
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true
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

    // Create email notification record
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'EMAIL',
        title: 'Order Confirmation',
        message: `Your order #${order.orderNumber} has been confirmed and is being processed.`,
        metadata: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          email: email,
          notificationType: type
        }),
        isRead: false
      }
    });

    // In a real application, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - Resend
    // 
    // For now, we'll simulate the email sending
    console.log(`Sending ${type} email to ${email} for order ${order.orderNumber}`);
    
    // Prepare common values
    const total = (order as any).totalPkr ?? (order as any).totalAmount ?? 0;
    const totalText = typeof total === 'number' ? `PKR ${total.toLocaleString()}` : `${total}`;

    // Simulate email content based on type
    let emailContent = '';
    switch (type) {
      case 'order_confirmation':
        emailContent = `
          Dear Customer,
          
          Thank you for your order! Your order #${order.orderNumber} has been confirmed.
          
          Order Details:
          - Order Number: ${order.orderNumber}
          - Total Amount: ${totalText}
          - Payment Method: ${order.paymentMethod}
          - Items: ${order.items.length} item(s)
          
          We'll send you another email when your order ships.
          
          Best regards,
          MCNmart Team
        `;
        break;
      case 'order_shipped':
        emailContent = `
          Dear Customer,
          
          Great news! Your order #${order.orderNumber} has been shipped.
          
          You can track your order using the tracking number: ${order.trackingNumber || 'TBD'}
          
          Best regards,
          MCNmart Team
        `;
        break;
      case 'order_delivered':
        emailContent = `
          Dear Customer,
          
          Your order #${order.orderNumber} has been delivered successfully.
          
          We hope you're satisfied with your purchase. Please consider leaving a review.
          
          Best regards,
          MCNmart Team
        `;
        break;
    }

    // Log the email content (in production, this would be sent via email service)
    console.log('Email Content:', emailContent);

    return NextResponse.json({
      success: true,
      message: 'Email notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}
