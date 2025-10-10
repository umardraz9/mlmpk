import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, membershipTier, amount, paymentMethod, paymentDetails } = await request.json();

    // Create admin notification for payment received
    const notification = await prisma.notification.create({
      data: {
        type: 'PAYMENT_RECEIVED',
        title: `New Membership Payment Received`,
        message: `Payment of Rs. ${amount.toLocaleString()} received for ${membershipTier} membership via ${paymentMethod}. Account: ${paymentDetails.accountNumber}${paymentDetails.transactionId ? `, Transaction ID: ${paymentDetails.transactionId}` : ''}`,
        isRead: false,
        data: JSON.stringify({
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          membershipTier,
          amount,
          paymentMethod,
          paymentDetails,
          timestamp: new Date().toISOString()
        })
      }
    });

    // Log the notification creation (simplified without systemLog model)
    console.log('Payment notification created:', {
      notificationId: notification.id,
      userId: session.user.id,
      membershipTier,
      amount,
      paymentMethod
    });

    return NextResponse.json({ 
      success: true, 
      notificationId: notification.id 
    });

  } catch (error) {
    console.error('Error creating payment notification:', error);
    return NextResponse.json(
      { error: 'Failed to create payment notification' },
      { status: 500 }
    );
  }
}
