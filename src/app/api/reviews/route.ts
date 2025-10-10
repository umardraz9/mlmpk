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

    const { orderId, productReviews, deliveryReview } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Verify order belongs to user and is delivered
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        status: 'DELIVERED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found or not eligible for review' },
        { status: 404 }
      );
    }

    const results = [];

    // Process product reviews
    if (productReviews && productReviews.length > 0) {
      for (const review of productReviews) {
        // Check if product exists in the order
        const orderItem = order.items.find(item => item.productId === review.productId);
        if (!orderItem) continue;

        // Check if review already exists
        const existingReview = await prisma.review.findFirst({
          where: {
            userId: session.user.id,
            productId: review.productId,
            orderId: orderId
          }
        });

        if (existingReview) {
          // Update existing review
          const updatedReview = await prisma.review.update({
            where: { id: existingReview.id },
            data: {
              rating: review.rating,
              comment: review.comment || null,
              images: review.images?.length > 0 ? JSON.stringify(review.images) : null,
              updatedAt: new Date()
            }
          });
          results.push({ type: 'product', action: 'updated', review: updatedReview });
        } else {
          // Create new review
          const newReview = await prisma.review.create({
            data: {
              userId: session.user.id,
              productId: review.productId,
              orderId: orderId,
              rating: review.rating,
              comment: review.comment || null,
              images: review.images?.length > 0 ? JSON.stringify(review.images) : null,
              isVerifiedPurchase: true
            }
          });
          results.push({ type: 'product', action: 'created', review: newReview });
        }

        // Update product average rating
        const productReviews = await prisma.review.findMany({
          where: { productId: review.productId },
          select: { rating: true }
        });

        const averageRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
        const reviewCount = productReviews.length;

        await prisma.product.update({
          where: { id: review.productId },
          data: {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            reviewCount: reviewCount
          }
        });
      }
    }

    // Process delivery review
    if (deliveryReview && deliveryReview.rating > 0) {
      // Check if delivery review already exists
      const existingDeliveryReview = await prisma.deliveryReview.findFirst({
        where: {
          userId: session.user.id,
          orderId: orderId
        }
      });

      if (existingDeliveryReview) {
        // Update existing delivery review
        const updatedDeliveryReview = await prisma.deliveryReview.update({
          where: { id: existingDeliveryReview.id },
          data: {
            rating: deliveryReview.rating,
            comment: deliveryReview.comment || null,
            deliverySpeed: deliveryReview.deliverySpeed || null,
            packagingQuality: deliveryReview.packagingQuality || null,
            courierBehavior: deliveryReview.courierBehavior || null,
            updatedAt: new Date()
          }
        });
        results.push({ type: 'delivery', action: 'updated', review: updatedDeliveryReview });
      } else {
        // Create new delivery review
        const newDeliveryReview = await prisma.deliveryReview.create({
          data: {
            userId: session.user.id,
            orderId: orderId,
            rating: deliveryReview.rating,
            comment: deliveryReview.comment || null,
            deliverySpeed: deliveryReview.deliverySpeed || null,
            packagingQuality: deliveryReview.packagingQuality || null,
            courierBehavior: deliveryReview.courierBehavior || null
          }
        });
        results.push({ type: 'delivery', action: 'created', review: newDeliveryReview });
      }
    }

    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'REVIEW',
        title: 'New Review Submitted',
        message: `User submitted reviews for order #${order.orderNumber}`,
        metadata: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          productReviewCount: productReviews?.length || 0,
          hasDeliveryReview: !!deliveryReview
        }),
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Reviews submitted successfully',
      results: results
    });

  } catch (error) {
    console.error('Error submitting reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit reviews' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product reviews
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Get total count
    const totalReviews = await prisma.review.count({
      where: { productId }
    });

    // Transform reviews for frontend
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      images: review.images ? JSON.parse(review.images) : [],
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt.toISOString(),
      user: {
        name: review.user.name || 'Anonymous',
        image: review.user.image
      }
    }));

    return NextResponse.json({
      success: true,
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
