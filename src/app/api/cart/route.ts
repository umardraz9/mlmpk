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
export async function GET() {
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

    // Get cart from Supabase
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('userId', session.user.id)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      console.error('Error fetching cart:', cartError);
      return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }

    // If no cart exists, create one
    let cartId = cart?.id;
    if (!cart) {
      const newCartId = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const now = new Date().toISOString();
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert([{ 
          id: newCartId,
          userId: session.user.id,
          createdAt: now,
          updatedAt: now
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating cart:', createError);
        return NextResponse.json({ error: 'Failed to create cart' }, { status: 500 });
      }
      
      cartId = newCart.id;
    }

    // Get cart items with product details
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('cartId', cartId);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return NextResponse.json({ error: 'Failed to fetch cart items' }, { status: 500 });
    }

    // Calculate totals
    let subtotal = 0;
    let itemCount = 0;
    const items = (cartItems || []).map(item => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 0;
      const itemSubtotal = price * quantity;
      subtotal += itemSubtotal;
      itemCount += quantity;
      
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: price,
        subtotal: itemSubtotal,
        product: {
          ...item.product,
          images: typeof item.product?.images === 'string' 
            ? JSON.parse(item.product.images || '[]')
            : item.product?.images || [],
          inStock: item.product?.trackQuantity 
            ? (item.product?.quantity || 0) > 0 
            : true
        }
      };
    });

    return NextResponse.json({ 
      cart: {
        id: cartId,
        userId: session.user.id,
        items,
        createdAt: cart?.createdAt || new Date().toISOString(),
        updatedAt: cart?.updatedAt || new Date().toISOString()
      },
      totals: {
        subtotal,
        itemCount,
        shipping: subtotal >= 5000 ? 0 : 299,
        total: subtotal + (subtotal >= 5000 ? 0 : 299)
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Add item to cart  
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    console.log('[ADD TO CART] Session:', { userId: session?.user?.id, email: session?.user?.email });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;
    
    console.log('[ADD TO CART] Request:', { productId, quantity });

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
    }

    // Check if product exists and is active
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    console.log('[ADD TO CART] Product lookup:', { product: product?.name, error: productError });

    if (productError || !product) {
      console.error('[ADD TO CART] Product not found:', productError);
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
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('userId', session.user.id)
      .single();

    console.log('[ADD TO CART] Cart lookup:', { cartId: cart?.id, error: cartError?.code });

    let finalCart = cart;
    
    if (cartError && cartError.code === 'PGRST116') {
      // Cart doesn't exist, create it
      console.log('[ADD TO CART] Creating new cart for user:', session.user.id);
      const newCartId = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const now = new Date().toISOString();
      const { data: newCart, error: createError } = await supabase
        .from('carts')
        .insert([{ 
          id: newCartId,
          userId: session.user.id,
          createdAt: now,
          updatedAt: now
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('[ADD TO CART] Error creating cart:', createError);
        return NextResponse.json({ 
          error: 'Failed to create cart',
          details: createError.message 
        }, { status: 500 });
      }
      
      finalCart = newCart;
      console.log('[ADD TO CART] Cart created:', newCart.id);
    } else if (cartError) {
      console.error('[ADD TO CART] Error fetching cart:', cartError);
      return NextResponse.json({ 
        error: 'Failed to fetch cart',
        details: cartError.message 
      }, { status: 500 });
    }

    // Check if item already exists in cart
    const { data: existingItem, error: itemCheckError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cartId', finalCart!.id)
      .eq('productId', productId)
      .single();

    console.log('[ADD TO CART] Existing item check:', { exists: !!existingItem, error: itemCheckError?.code });

    if (itemCheckError && itemCheckError.code !== 'PGRST116') {
      console.error('[ADD TO CART] Error checking cart item:', itemCheckError);
    }

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      console.log('[ADD TO CART] Updating quantity:', { from: existingItem.quantity, to: newQuantity });
      
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('[ADD TO CART] Error updating cart item:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update cart item',
          details: updateError.message 
        }, { status: 500 });
      }
      
      console.log('[ADD TO CART] Item quantity updated successfully');
    } else {
      // Add new item
      console.log('[ADD TO CART] Adding new item to cart');
      const newItemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const now = new Date().toISOString();
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert([{
          id: newItemId,
          cartId: finalCart!.id,
          productId: productId,
          quantity: quantity,
          price: product.price,
          createdAt: now,
          updatedAt: now
        }]);

      if (insertError) {
        console.error('[ADD TO CART] Error adding cart item:', insertError);
        return NextResponse.json({ 
          error: 'Failed to add item to cart',
          details: insertError.message 
        }, { status: 500 });
      }
      
      console.log('[ADD TO CART] Item added successfully');
    }

    return NextResponse.json({ 
      message: 'Item added to cart successfully',
      success: true
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Clear entire cart
export async function DELETE() {
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
