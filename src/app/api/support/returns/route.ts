import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// GET - Get return requests for user or admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = session.user.isAdmin ? {} : { userId: session.user.id };
    if (status) {
      where.status = status;
    }

    const [returns, totalCount] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              orderNumber: true,
              totalPkr: true
            }
          }
        }
      }),
      prisma.returnRequest.count({ where })
    ]);

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching return requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new return request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderId,
      reason,
      description,
      requestedAmount,
      returnType = 'REFUND'
    } = body;

    // Validate required fields
    if (!orderId || !reason || !description) {
      return NextResponse.json({ 
        error: 'Order ID, reason, and description are required' 
      }, { status: 400 });
    }

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if order is eligible for return (within 30 days)
    const orderDate = new Date(order.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (orderDate < thirtyDaysAgo) {
      return NextResponse.json({ 
        error: 'Return period has expired. Returns are only accepted within 30 days.' 
      }, { status: 400 });
    }

    // Generate return number
    const returnNumber = `RET${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        returnNumber,
        userId: session.user.id,
        orderId,
        reason,
        description,
        requestedAmount: requestedAmount || order.totalPkr,
        returnType,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        order: {
          select: {
            orderNumber: true,
            totalPkr: true
          }
        }
      }
    });

    // Create admin notification
    await prisma.notification.create({
      data: {
        title: 'New Return Request',
        message: `Return request ${returnNumber} submitted for order ${order.orderNumber}`,
        type: 'info',
        category: 'support',
        priority: 'medium',
        role: 'ADMIN',
        data: JSON.stringify({
          returnId: returnRequest.id,
          returnNumber,
          orderNumber: order.orderNumber,
          customerName: session.user.name || session.user.email,
          amount: requestedAmount || order.totalPkr,
          reason
        }),
        actionUrl: `/admin/support/returns/${returnRequest.id}`,
        actionText: 'Review Request'
      }
    });

    // Create user notification
    await prisma.notification.create({
      data: {
        title: 'Return Request Submitted',
        message: `Your return request ${returnNumber} has been submitted and is under review.`,
        type: 'success',
        category: 'support',
        recipientId: session.user.id,
        data: JSON.stringify({
          returnId: returnRequest.id,
          returnNumber,
          status: 'PENDING'
        }),
        actionUrl: `/support/returns/${returnRequest.id}`,
        actionText: 'View Request'
      }
    });

    return NextResponse.json({
      message: 'Return request submitted successfully',
      returnRequest
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating return request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
