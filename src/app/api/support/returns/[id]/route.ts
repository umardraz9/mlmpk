import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// GET - Get specific return request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalPkr: true,
            createdAt: true,
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    price: true,
                    images: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    // Check authorization
    if (returnRequest.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ returnRequest });

  } catch (error) {
    console.error('Error fetching return request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update return request (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      status,
      adminNotes,
      refundAmount,
      refundMethod,
      processedBy
    } = body;

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      }, { status: 400 });
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: params.id },
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
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    // Update return request
    const updatedReturn = await prisma.returnRequest.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(adminNotes && { adminNotes }),
        ...(refundAmount && { refundAmount }),
        ...(refundMethod && { refundMethod }),
        ...(processedBy && { processedBy }),
        ...(status && { processedAt: new Date() })
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
            orderNumber: true
          }
        }
      }
    });

    // Create notification for user based on status
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType: 'success' | 'info' | 'warning' | 'error' = 'info';

    switch (status) {
      case 'APPROVED':
        notificationTitle = 'Return Request Approved';
        notificationMessage = `Your return request ${returnRequest.returnNumber} has been approved. Refund processing will begin shortly.`;
        notificationType = 'success';
        break;
      case 'REJECTED':
        notificationTitle = 'Return Request Rejected';
        notificationMessage = `Your return request ${returnRequest.returnNumber} has been rejected. ${adminNotes || 'Please contact support for more information.'}`;
        notificationType = 'error';
        break;
      case 'PROCESSING':
        notificationTitle = 'Return Being Processed';
        notificationMessage = `Your return request ${returnRequest.returnNumber} is being processed. You will receive your refund soon.`;
        notificationType = 'info';
        break;
      case 'COMPLETED':
        notificationTitle = 'Refund Completed';
        notificationMessage = `Your refund of PKR ${refundAmount || returnRequest.requestedAmount} has been processed successfully.`;
        notificationType = 'success';
        break;
    }

    if (notificationTitle) {
      await prisma.notification.create({
        data: {
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          category: 'support',
          recipientId: returnRequest.userId,
          data: JSON.stringify({
            returnId: returnRequest.id,
            returnNumber: returnRequest.returnNumber,
            status,
            refundAmount: refundAmount || returnRequest.requestedAmount
          }),
          actionUrl: `/support/returns/${returnRequest.id}`,
          actionText: 'View Details'
        }
      });
    }

    // If completed, process refund to user wallet
    if (status === 'COMPLETED' && refundAmount) {
      await prisma.user.update({
        where: { id: returnRequest.userId },
        data: {
          totalEarnings: {
            increment: refundAmount
          }
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: returnRequest.userId,
          type: 'REFUND',
          amount: refundAmount,
          description: `Refund for return request ${returnRequest.returnNumber}`,
          status: 'COMPLETED',
          reference: returnRequest.returnNumber
        }
      });
    }

    return NextResponse.json({
      message: 'Return request updated successfully',
      returnRequest: updatedReturn
    });

  } catch (error) {
    console.error('Error updating return request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
