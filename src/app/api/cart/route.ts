import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      // Return empty cart for unauthenticated users instead of error
      return NextResponse.json({ 
        items: [],
        total: 0,
        itemCount: 0
      }, { status: 200 });
    }

    // Mock cart implementation - return empty cart
    // TODO: Implement Supabase cart storage
    return NextResponse.json({ 
      cart: {
        id: `cart-${session.user.id}`,
        userId: session.user.id,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      totals: {
        subtotal: 0,
        itemCount: 0
      }
    });

    /*
    // Original Prisma code - disabled
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                comparePrice: true,
                images: true,
                quantity: true,
                trackQuantity: true,
                status: true,
                category: {
                  select: {
                    name: true,
                    color: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  comparePrice: true,
                  images: true,
                  quantity: true,
                  trackQuantity: true,
                  status: true,
                  category: {
                    select: {
                      name: true,
                      color: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    }

    // Parse images and calculate totals
    const cartWithParsedData = {
      ...cart,
      items: cart.items.map(item => {
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
            images,
            inStock: item.product.trackQuantity ? item.product.quantity > 0 : true
          },
          subtotal: item.price * item.quantity
        };
      })
    };

    // Calculate cart totals
    const subtotal = cartWithParsedData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = cartWithParsedData.items.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      cart: cartWithParsedData,
      totals: {
        subtotal,
        itemCount,
        shipping: subtotal >= 5000 ? 0 : 299,
        total: subtotal + (subtotal >= 5000 ? 0 : 299)
      }
    });
    */
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add item to cart  
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Mock implementation - return success
    return NextResponse.json({ 
      message: 'Item added to cart',
      cart: {
        id: `cart-${session.user.id}`,
        items: [],
        total: 0
      }
    });
    
    /*
    // Original Prisma code - disabled

    // Find user by email to get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
    }

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!['ACTIVE', 'PUBLISHED'].includes(product.status)) {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
    }

    // Check stock if tracking is enabled
    if (product.trackQuantity && product.quantity < quantity) {
      return NextResponse.json({ 
        error: `Only ${product.quantity} items available in stock` 
      }, { status: 400 });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id }
      });
    }

    // Check if item already exists in cart
    let existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId
      }
    });

    let cartItem;
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      // Check stock for new total quantity
      if (product.trackQuantity && product.quantity < newQuantity) {
        return NextResponse.json({ 
          error: `Cannot add ${quantity} more items. Only ${product.quantity - existingItem.quantity} more available` 
        }, { status: 400 });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { 
          quantity: newQuantity,
          price: product.price // Update price in case it changed
        },
        include: {
          product: {
            select: {
              name: true,
              images: true
            }
          }
        }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
          price: product.price
        },
        include: {
          product: {
            select: {
              name: true,
              images: true
            }
          }
        }
      });
    }

    return NextResponse.json({
      message: 'Item added to cart successfully',
      cartItem: {
        ...cartItem,
        subtotal: cartItem.price * cartItem.quantity
      }
    }, { 
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
    */
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Mock implementation - return success
    return NextResponse.json({ message: 'Cart cleared successfully' });
    
    /*
    // Original Prisma code - disabled

    // Find user by email to get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all cart items for user
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: user.id
        }
      }
    });

    return NextResponse.json({ message: 'Cart cleared successfully' });
    */
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
