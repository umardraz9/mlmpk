import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { amount, method, userId } = await request.json();

    // Validate input
    if (!amount || !method || !userId) {
      return NextResponse.json(
        { message: 'Amount, payment method, and user ID are required' },
        { status: 400 }
      );
    }

    // Demo mode - simulate payment initiation
    const paymentData = {
      id: 'payment_' + Date.now(),
      amount,
      method,
      userId,
      status: 'pending',
      transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };

    return NextResponse.json({
      message: 'Payment initiated successfully (Demo mode)',
      payment: paymentData,
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment methods availability
export async function GET() {
  try {
    return NextResponse.json({
      availablePaymentMethods: [
        {
          method: 'jazzcash',
          name: 'JazzCash',
          description: 'Pay using JazzCash mobile wallet',
          logo: '/images/jazzcash-logo.png',
          isAvailable: true
        },
        {
          method: 'easypaisa',
          name: 'EasyPaisa', 
          description: 'Pay using EasyPaisa mobile wallet',
          logo: '/images/easypaisa-logo.png',
          isAvailable: true
        }
      ],
      investmentAmount: 1000,
      currency: 'PKR',
      description: 'One-time investment to activate your MLM account'
    });
  } catch (error) {
    console.error('Payment methods error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
} 