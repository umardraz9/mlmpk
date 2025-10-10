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
    const paymentMethod = searchParams.get('paymentMethod');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
    }
    
    if (status && status !== 'all') {
      where.paymentStatus = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // Get payment data
    const [
      payments,
      totalPayments,
      paymentStats,
      codPayments,
      onlinePayments,
      pendingPayments,
      failedPayments,
      refundedPayments
    ] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalPkr: true,
          paidAmountPkr: true,
          paymentMethod: true,
          paymentStatus: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true
            }
          }
        }
      }),

      prisma.order.count({ where }),

      prisma.order.aggregate({
        _sum: {
          totalPkr: true,
          paidAmountPkr: true
        },
        _count: { id: true },
        where
      }),

      prisma.order.count({
        where: { paymentMethod: 'COD' }
      }),

      prisma.order.count({
        where: { 
          paymentMethod: { 
            in: ['JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER', 'CARD'] 
          } 
        }
      }),

      prisma.order.count({
        where: { paymentStatus: 'PENDING' }
      }),

      prisma.order.count({
        where: { paymentStatus: 'FAILED' }
      }),

      prisma.order.count({
        where: { paymentStatus: 'REFUNDED' }
      })
    ]);

    // Get payment method breakdown
    const paymentMethodStats = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
      _sum: { totalPkr: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // Get daily payment trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrends = await prisma.order.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      _sum: { totalPkr: true },
      where: {
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: 'PAID'
      }
    });

    const analytics = {
      totalPayments: paymentStats._count.id || 0,
      totalAmount: paymentStats._sum.totalPkr || 0,
      paidAmount: paymentStats._sum.paidAmountPkr || 0,
      codPayments,
      onlinePayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      paymentMethodStats,
      dailyTrends
    };

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        totalPayments,
        totalPages: Math.ceil(totalPayments / limit)
      },
      analytics
    });
  } catch (error) {
    console.error('Error fetching payment tracking data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update payment status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, paymentStatus, transactionId, notes } = body;

    if (!orderId || !paymentStatus) {
      return NextResponse.json({ 
        error: 'Order ID and payment status are required' 
      }, { status: 400 });
    }

    // Validate payment status
    const validStatuses = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'];
    if (!validStatuses.includes(paymentStatus)) {
      return NextResponse.json({ 
        error: 'Invalid payment status' 
      }, { status: 400 });
    }

    // Get current order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update payment status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        paidAmountPkr: paymentStatus === 'PAID' ? order.totalPkr : 0,
        updatedAt: new Date()
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: order.userId,
        type: paymentStatus === 'PAID' ? 'PAYMENT_RECEIVED' : 'PAYMENT_UPDATE',
        amount: paymentStatus === 'PAID' ? order.totalPkr : 0,
        description: `Payment ${paymentStatus.toLowerCase()} for order #${order.orderNumber}${notes ? ` - ${notes}` : ''}`,
        status: 'COMPLETED',
        reference: transactionId || `PAY-${orderId}-${Date.now()}`
      }
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        title: `Payment ${paymentStatus}`,
        message: `Your payment for order #${order.orderNumber} has been ${paymentStatus.toLowerCase()}`,
        type: paymentStatus === 'PAID' ? 'success' : 'info',
        recipientId: order.userId,
        actionUrl: `/orders/${order.id}`
      }
    });

    return NextResponse.json({
      message: 'Payment status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
