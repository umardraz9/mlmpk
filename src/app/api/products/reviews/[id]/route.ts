import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// GET - Get specific product review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.productReview.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review });

  } catch (error) {
    console.error('Error fetching product review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update review (admin approval/rejection)
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
    const { isApproved, adminNotes } = body;

    const review = await prisma.productReview.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        product: {
          select: {
            name: true
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Update review
    const updatedReview = await prisma.productReview.update({
      where: { id: params.id },
      data: {
        isApproved,
        adminNotes,
        reviewedAt: new Date()
      }
    });

    // Create notification for user
    const notificationTitle = isApproved ? 'Review Approved' : 'Review Rejected';
    const notificationMessage = isApproved 
      ? `Your review for ${review.product.name} has been approved and is now visible.`
      : `Your review for ${review.product.name} has been rejected. ${adminNotes || 'Please contact support for more information.'}`;

    await prisma.notification.create({
      data: {
        title: notificationTitle,
        message: notificationMessage,
        type: isApproved ? 'success' : 'warning',
        category: 'review',
        recipientId: review.userId,
        data: JSON.stringify({
          reviewId: review.id,
          productName: review.product.name,
          isApproved,
          adminNotes
        }),
        actionUrl: `/products/${review.productId}`,
        actionText: 'View Product'
      }
    });

    return NextResponse.json({
      message: `Review ${isApproved ? 'approved' : 'rejected'} successfully`,
      review: updatedReview
    });

  } catch (error) {
    console.error('Error updating product review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const review = await prisma.productReview.findUnique({
      where: { id: params.id }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user owns the review or is admin
    if (review.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.productReview.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
