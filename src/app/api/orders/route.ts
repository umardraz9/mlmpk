import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase, createServerSupabaseClient } from '@/lib/supabase';

interface SupabaseOrderItem {
  product?: {
    images?: string | string[];
  };
  [key: string]: unknown;
}

interface ProductRow {
  id: string;
  price?: number | null;
  status?: string | null;
  trackQuantity?: boolean | null;
  quantity?: number | null;
  name?: string | null;
}

// GET - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const orderStatus = searchParams.get('status');
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch orders from Supabase
    let query = supabase
      .from('orders')
      .select('*, order_items(*, product:products(*))', { count: 'exact' })
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false });

    if (orderStatus) {
      query = query.eq('status', orderStatus);
    }

    query = query.range(from, to);

    const { data: orders, error: ordersError, count: totalCount } = await query;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Parse product images
    const ordersWithParsedImages = (orders || []).map(order => ({
      ...order,
      items: (order.order_items || []).map((item: SupabaseOrderItem) => {
        let images = ['/api/placeholder/80/80']; // Default fallback
        
        try {
          if (item.product?.images) {
            const productImages = typeof item.product.images === 'string' 
              ? JSON.parse(item.product.images) 
              : item.product.images;
            
            if (Array.isArray(productImages) && productImages.length > 0) {
              images = productImages.filter((img: string) => img && img !== '');
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
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
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
    const session = await getSession();
    const admin = createServerSupabaseClient();
    
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
      notes,
      paymentProof
    } = body;

    // Validate required fields
    if (!paymentMethod || !shippingAddress || !city || !phone || !email) {
      return NextResponse.json({ 
        error: 'Payment method, shipping address, city, phone, and email are required' 
      }, { status: 400 });
    }

    console.log('Creating order for user:', session.user.id);

    // Get user's cart
    const { data: foundCart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('userId', session.user.id)
      .single();
    console.log('Cart lookup:', { cartId: foundCart?.id, error: cartError });

    let cart = foundCart as { id: string } | null;
    let cartItems: any[] | null = null;
    if (!cart) {
      // No server cart; proceed with fallback by simulating empty items
      cartItems = [];
    } else {
      // Get cart items with products
      const res = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('cartId', cart.id);
      cartItems = res.data || [];
    }

    console.log('Cart items found:', cartItems?.length || 0);

    if (!cartItems || cartItems.length === 0) {
      console.error('Cart is empty for user:', session.user.id);
      // Backend fallback: accept client-provided items when server cart is empty
      const rawItems = (body as any)?.clientItems || (body as any)?.items || [];
      const clientItems: Array<{ productId: string; quantity: number }> = [];
      if (Array.isArray(rawItems)) {
        for (const it of rawItems) {
          const pid = typeof it?.productId === 'string' && it.productId.trim().length > 0
            ? it.productId
            : (typeof it?.id === 'string' && it.id.trim().length > 0 && isNaN(Number(it.id))
              ? it.id
              : null);
          const qty = Number(it?.quantity) || 0;
          if (pid && qty > 0) {
            clientItems.push({ productId: pid, quantity: qty });
          }
        }
      }

      if (clientItems.length === 0) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
      }

      // Merge duplicates by productId
      const mergedMap = new Map<string, number>();
      for (const ci of clientItems) {
        mergedMap.set(ci.productId, (mergedMap.get(ci.productId) || 0) + ci.quantity);
      }
      const merged = Array.from(mergedMap.entries()).map(([productId, quantity]) => ({ productId, quantity }));

      // Load products
      const productIds = merged.map(m => m.productId);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (productsError) {
        console.error('Error loading products for fallback order:', productsError);
        return NextResponse.json({ error: 'Failed to validate products' }, { status: 500 });
      }

      // Build a map for product lookup
      const productMap = new Map<string, ProductRow>();
      for (const p of (products || []) as ProductRow[]) productMap.set(p.id, p);

      // Validate and compute totals
      let subtotal = 0;
      const virtualItems: Array<{ productId: string; quantity: number; price: number }> = [];
      for (const { productId, quantity } of merged) {
        const product = productMap.get(productId);
        if (!product) {
          return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 400 });
        }
        if (!['ACTIVE', 'PUBLISHED'].includes((product.status || '').toString())) {
          return NextResponse.json({ error: `Product not available: ${product.name || productId}` }, { status: 400 });
        }
        if (product.trackQuantity && Number(product.quantity || 0) < quantity) {
          return NextResponse.json({ error: `Insufficient stock for ${product.name || productId}` }, { status: 400 });
        }
        const price = Number(product.price || 0);
        subtotal += price * quantity;
        virtualItems.push({ productId, quantity, price });
      }

      const shipping = subtotal >= 5000 ? 0 : 299;
      const total = subtotal - voucherUsed + shipping;

      // Generate order number
      const orderNumber = `MCN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          orderNumber,
          userId: session.user.id,
          subtotalPkr: subtotal,
          voucherUsedPkr: voucherUsed,
          shippingPkr: shipping,
          totalPkr: total,
          paymentMethod,
          paymentProof: paymentProof || null,
          shippingAddress,
          city,
          province: province || null,
          postalCode: postalCode || null,
          phone,
          email,
          notes: notes || null,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order (fallback):', orderError);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
      }

      // Insert order items
      const orderItems = virtualItems.map(v => ({
        id: `order-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderId: order.id,
        productId: v.productId,
        quantity: v.quantity,
        pricePkr: v.price,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      const { error: itemsError2 } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError2) {
        console.error('Error creating order items (fallback):', itemsError2);
      }

      // Notify admin
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .or('role.eq.ADMIN,isAdmin.eq.true');

      if (adminUsers && adminUsers.length > 0) {
        const adminNotifications = adminUsers.map(admin => ({
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: admin.id,
          title: 'New Order Received',
          message: `Order ${orderNumber} placed by customer. Total: PKR ${total}`,
          type: 'order',
          read: false,
          createdAt: new Date().toISOString()
        }));
        await admin.from('notifications').insert(adminNotifications);
      }

      return NextResponse.json({
        message: 'Order placed successfully',
        order: {
          ...order,
          items: virtualItems
        },
        orderNumber
      }, { status: 201 });
    }

    // Calculate totals
    let subtotal = 0;
    cartItems.forEach(item => {
      subtotal += (item.product?.price || 0) * item.quantity;
    });

    const shipping = subtotal >= 5000 ? 0 : 299;
    const total = subtotal - voucherUsed + shipping;

    // Generate order number
    const orderNumber = `MCN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order in Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        id: orderId,
        orderNumber,
        userId: session.user.id,
        subtotalPkr: subtotal,
        voucherUsedPkr: voucherUsed,
        shippingPkr: shipping,
        totalPkr: total,
        paymentMethod,
        paymentProof: paymentProof || null,
        shippingAddress,
        city,
        province: province || null,
        postalCode: postalCode || null,
        phone,
        email,
        notes: notes || null,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      id: `order-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      pricePkr: item.product?.price || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
    }

    // Clear cart items
    if (cart) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('cartId', cart.id);
    }

    // Create notification for admin
    const { data: adminUsers } = await admin
      .from('users')
      .select('id')
      .or('role.eq.ADMIN,isAdmin.eq.true');

    if (adminUsers && adminUsers.length > 0) {
      const adminNotifications = adminUsers.map(admin => ({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: admin.id,
        title: 'New Order Received',
        message: `Order ${orderNumber} placed by customer. Total: PKR ${total}`,
        type: 'order',
        read: false,
        createdAt: new Date().toISOString()
      }));

      await admin
        .from('notifications')
        .insert(adminNotifications);
    }

    console.log('Order created successfully:', orderNumber);

    return NextResponse.json({
      message: 'Order placed successfully',
      order: {
        ...order,
        items: cartItems
      },
      orderNumber
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; stack?: string } | undefined;
    console.error('Error creating order:', {
      message: err?.message,
      code: err?.code,
      stack: err?.stack
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err?.message
    }, { status: 500 });
  }
}
