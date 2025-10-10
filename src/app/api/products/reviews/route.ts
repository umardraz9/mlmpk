import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// GET - Get product reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const skip = (page - 1) * limit;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const [reviews, totalCount, averageRating] = await Promise.all([
      prisma.productReview.findMany({
        where: { 
          productId,
          isApproved: true 
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),
      prisma.productReview.count({ 
        where: { 
          productId,
          isApproved: true 
        } 
      }),
      prisma.productReview.aggregate({
        where: { 
          productId,
          isApproved: true 
        },
        _avg: {
          rating: true
        }
      })
    ]);

    // Get rating distribution
    const ratingDistribution = await prisma.productReview.groupBy({
      by: ['rating'],
      where: { 
        productId,
        isApproved: true 
      },
      _count: {
        rating: true
      }
    });

    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratingDistribution.find(r => r.rating === rating)?._count.rating || 0
    }));

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      averageRating: averageRating._avg.rating || 0,
      totalReviews: totalCount,
      ratingDistribution: distribution
    });

  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new product review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      productId,
      rating,
      title,
      comment,
      images
    } = body;

    // Validate required fields
    if (!productId || !rating || !title || !comment) {
      return NextResponse.json({ 
        error: 'Product ID, rating, title, and comment are required' 
      }, { status: 400 });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: 'DELIVERED'
        }
      }
    });

    if (!hasPurchased) {
      return NextResponse.json({ 
        error: 'You can only review products you have purchased' 
      }, { status: 403 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.productReview.findFirst({
      where: {
        productId,
        userId: session.user.id
      }
    });

    if (existingReview) {
      return NextResponse.json({ 
        error: 'You have already reviewed this product' 
      }, { status: 409 });
    }

    // Create review
    const review = await prisma.productReview.create({
      data: {
        userId: session.user.id,
        productId,
        rating,
        title,
        comment,
        images: images ? JSON.stringify(images) : null,
        isApproved: false // Reviews need admin approval
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Create notification for admin
    await prisma.notification.create({
      data: {
        title: 'New Product Review',
        message: `New review submitted for ${product.name}`,
        type: 'info',
        category: 'review',
        priority: 'medium',
        role: 'ADMIN',
        data: JSON.stringify({
          reviewId: review.id,
          productId,
          productName: product.name,
          rating,
          reviewerName: session.user.name || session.user.email
        }),
        actionUrl: `/admin/reviews/${review.id}`,
        actionText: 'Review Submission'
      }
    });

    return NextResponse.json({
      message: 'Review submitted successfully. It will be visible after admin approval.',
      review
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
