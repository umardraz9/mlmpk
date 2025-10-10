import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import type { Session } from 'next-auth';

// GET - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: session.user.id as string };
    if (status) {
      where.status = status;
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true
                }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    // Parse product images
    const ordersWithParsedImages = orders.map(order => ({
      ...order,
      items: order.items.map(item => {
        let images = ['/api/placeholder/80/80']; // Default fallback
        
        try {
          if (item.product.images) {
            if (item.product.images.startsWith('[')) {
              const parsed = JSON.parse(item.product.images);
              if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
                images = parsed.filter(img => img && img !== '');
              }
            } else if (item.product.images !== '[]' && item.product.images !== '') {
              images = [item.product.images];
            }
          }
        } catch {
          // Keep default fallback
        }
        
        // Ensure we always have at least one valid image
        if (!images.length || !images[0]) {
          images = ['/api/placeholder/80/80'];
        }

        return {
          ...item,
          product: {
            ...item.product,
            images
          }
        };
      })
    }));

    return NextResponse.json({
      orders: ordersWithParsedImages,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      paymentMethod,
      shippingAddress,
      city,
      province,
      postalCode,
      phone,
      email,
      voucherUsed = 0,
      notes
    } = body;

    // Validate required fields
    if (!paymentMethod || !shippingAddress || !city || !phone || !email) {
      return NextResponse.json({ 
        error: 'Payment method, shipping address, city, phone, and email are required' 
      }, { status: 400 });
    }

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id as string },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Validate stock availability
    for (const item of cart.items) {
      if (item.product.status !== 'ACTIVE') {
        return NextResponse.json({ 
          error: `Product "${item.product.name}" is no longer available` 
        }, { status: 400 });
      }

      if (item.product.trackQuantity && item.product.quantity < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for "${item.product.name}". Only ${item.product.quantity} available` 
        }, { status: 400 });
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 5000 ? 0 : 299;
    const voucherDiscount = Math.min(voucherUsed, subtotal);
    const total = subtotal + shipping - voucherDiscount;

    // Validate voucher usage
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { availableVoucherPkr: true }
    });

    if (voucherDiscount > (user?.availableVoucherPkr || 0)) {
      return NextResponse.json({ 
        error: 'Insufficient voucher balance' 
      }, { status: 400 });
    }

    // Generate order number
    const orderNumber = `MCN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id as string,
          orderNumber,
          subtotalPkr: subtotal,
          voucherUsedPkr: voucherDiscount,
          shippingPkr: shipping,
          totalPkr: total,
          paymentMethod,
          shippingAddress,
          city,
          province,
          postalCode,
          phone,
          email,
          notes,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              price: item.price,
              totalPrice: item.price * item.quantity
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true
                }
              }
            }
          }
        }
      });

      // Update product quantities
      for (const item of cart.items) {
        if (item.product.trackQuantity) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity
              },
              sales: {
                increment: item.quantity
              }
            }
          });
        }
      }

      // Update user voucher balance
      if (voucherDiscount > 0) {
        await tx.user.update({
          where: { id: session.user.id as string },
          data: {
            availableVoucherPkr: {
              decrement: voucherDiscount
            }
          }
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
    });

    // Create admin notification
    await prisma.notification.create({
      data: {
        title: 'New Order Received',
        message: `Order ${orderNumber} placed by ${session.user.name || session.user.email} for PKR ${total.toLocaleString()}`,
        type: 'success',
        category: 'order',
        priority: 'high',
        role: 'ADMIN',
        data: JSON.stringify({
          orderId: order.id,
          orderNumber,
          customerName: session.user.name || session.user.email,
          total,
          itemCount: cart.items.length
        }),
        actionUrl: `/admin/orders/${order.id}`,
        actionText: 'View Order'
      }
    });

    // Create user notification
    await prisma.notification.create({
      data: {
        title: 'Order Placed Successfully',
        message: `Your order ${orderNumber} has been placed and will be processed shortly.`,
        type: 'success',
        category: 'order',
        recipientId: session.user.id as string,
        data: JSON.stringify({
          orderId: order.id,
          orderNumber,
          total
        }),
        actionUrl: `/orders/${order.id}`,
        actionText: 'View Order'
      }
    });

    // Fire-and-forget: send order confirmation email to user
    try {
      const origin = request.nextUrl.origin;
      await fetch(`${origin}/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward cookies so session is available in the nested route
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          type: 'order_confirmation',
          orderId: order.id,
          email
        })
      }).catch(() => {});
    } catch (e) {
      console.error('Failed to trigger order confirmation email', e);
    }

    return NextResponse.json({
      message: 'Order placed successfully',
      order: {
        ...order,
        items: order.items.map(item => {
          let images = [];
          try {
            if (item.product.images) {
              if (item.product.images.startsWith('[')) {
                images = JSON.parse(item.product.images);
              } else {
                images = [item.product.images];
              }
            }
          } catch (e) {
            images = item.product.images ? [item.product.images] : [];
          }

          return {
            ...item,
            product: {
              ...item.product,
              images
            }
          };
        })
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
