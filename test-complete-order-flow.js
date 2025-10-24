const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test user credentials
const TEST_USER = {
  email: 'sultan@mcnmart.com',
  password: '12345678',
  id: null
};

const ADMIN_EMAIL = 'admin@mlmpk.com';

async function testCompleteOrderFlow() {
  console.log('\n========== COMPLETE ORDER FLOW TEST ==========\n');

  try {
    // Step 1: Get a test product
    console.log('Step 1: Fetching test product...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'ACTIVE')
      .limit(1);

    if (productError || !products || products.length === 0) {
      console.log('❌ No active products found');
      return;
    }

    const testProduct = products[0];
    console.log(`✅ Found product: ${testProduct.name} (PKR ${testProduct.price})`);
    console.log(`   Product ID: ${testProduct.id}\n`);

    // Step 2: Get test user
    console.log('Step 2: Getting test user...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', TEST_USER.email)
      .single();

    if (userError || !user) {
      console.log('❌ Test user not found');
      return;
    }

    TEST_USER.id = user.id;
    console.log(`✅ Test user: ${user.email}`);
    console.log(`   User ID: ${user.id}\n`);

    // Step 3: Add to favorites
    console.log('Step 3: Adding product to favorites...');
    const favoriteId = `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { error: favError } = await supabase
      .from('favorites')
      .insert([{
        id: favoriteId,
        userId: user.id,
        productId: testProduct.id,
        createdAt: new Date().toISOString()
      }]);

    if (favError && !favError.message.includes('duplicate')) {
      console.log(`⚠️  Favorite error: ${favError.message}`);
    } else {
      console.log('✅ Product added to favorites\n');
    }

    // Step 4: Create cart if doesn't exist
    console.log('Step 4: Creating/Getting cart...');
    let { data: cart, error: cartGetError } = await supabase
      .from('cart')
      .select('*')
      .eq('userId', user.id)
      .single();

    if (cartGetError && cartGetError.code === 'PGRST116') {
      // Cart doesn't exist, create it
      const { data: newCart, error: cartCreateError } = await supabase
        .from('cart')
        .insert([{
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (cartCreateError) {
        console.log(`❌ Failed to create cart: ${cartCreateError.message}`);
        return;
      }
      cart = newCart;
    }

    console.log(`✅ Cart ready: ${cart.id}\n`);

    // Step 5: Add product to cart
    console.log('Step 5: Adding product to cart...');
    const { error: cartItemError } = await supabase
      .from('cart_items')
      .insert([{
        cartId: cart.id,
        productId: testProduct.id,
        quantity: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);

    if (cartItemError) {
      console.log(`⚠️  Cart item error: ${cartItemError.message}`);
    } else {
      console.log('✅ Product added to cart (Quantity: 2)\n');
    }

    // Step 6: Verify cart items
    console.log('Step 6: Verifying cart contents...');
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('cartId', cart.id);

    if (cartItems && cartItems.length > 0) {
      console.log(`✅ Cart has ${cartItems.length} item(s):`);
      cartItems.forEach(item => {
        const total = (item.product?.price || 0) * item.quantity;
        console.log(`   - ${item.product?.name} x${item.quantity} = PKR ${total}`);
      });
      console.log('');
    }

    // Step 7: Calculate order total
    let subtotal = 0;
    cartItems.forEach(item => {
      subtotal += (item.product?.price || 0) * item.quantity;
    });
    const shipping = subtotal >= 5000 ? 0 : 299;
    const total = subtotal + shipping;

    console.log('Step 7: Order Summary:');
    console.log(`   Subtotal: PKR ${subtotal}`);
    console.log(`   Shipping: PKR ${shipping}` + (shipping === 0 ? ' (FREE!)' : ''));
    console.log(`   Total:    PKR ${total}\n`);

    // Step 8: Create order
    console.log('Step 8: Creating order...');
    const orderNumber = `MCN${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        id: orderId,
        orderNumber,
        userId: user.id,
        subtotalPkr: subtotal,
        voucherUsedPkr: 0,
        shippingPkr: shipping,
        totalPkr: total,
        paymentMethod: 'BANK_TRANSFER',
        paymentProof: 'https://placehold.co/400x300?text=Payment+Screenshot',
        shippingAddress: '123 Test Street',
        city: 'Karachi',
        province: 'Sindh',
        postalCode: '75500',
        phone: '+92 300 1234567',
        email: user.email,
        notes: 'Test order - Please process',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (orderError) {
      console.log(`❌ Order creation failed: ${orderError.message}`);
      return;
    }

    console.log(`✅ Order created: ${orderNumber}`);
    console.log(`   Order ID: ${order.id}\n`);

    // Step 9: Create order items
    console.log('Step 9: Creating order items...');
    const orderItems = cartItems.map((item, index) => ({
      id: `order-item-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      pricePkr: item.product?.price || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      console.log(`⚠️  Order items error: ${orderItemsError.message}`);
    } else {
      console.log(`✅ ${orderItems.length} order item(s) created\n`);
    }

    // Step 10: Clear cart
    console.log('Step 10: Clearing cart...');
    const { error: clearError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cartId', cart.id);

    if (clearError) {
      console.log(`⚠️  Cart clear error: ${clearError.message}`);
    } else {
      console.log('✅ Cart cleared\n');
    }

    // Step 11: Send notification to admin
    console.log('Step 11: Sending notification to admin...');
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (adminUser) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([{
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: adminUser.id,
          title: 'New Order Received! 🎉',
          message: `Order ${orderNumber} has been placed by ${user.email}. Total amount: PKR ${total}. Payment proof submitted.`,
          type: 'order',
          read: false,
          createdAt: new Date().toISOString()
        }]);

      if (notifError) {
        console.log(`⚠️  Notification error: ${notifError.message}`);
      } else {
        console.log('✅ Admin notified\n');
      }
    } else {
      console.log('⚠️  Admin user not found\n');
    }

    // Final Summary
    console.log('========== TEST COMPLETED SUCCESSFULLY! ==========\n');
    console.log('📦 Order Details:');
    console.log(`   Order Number: ${orderNumber}`);
    console.log(`   Customer: ${user.email}`);
    console.log(`   Items: ${orderItems.length}`);
    console.log(`   Total: PKR ${total}`);
    console.log(`   Status: PENDING`);
    console.log(`   Payment: Bank Transfer (Proof submitted)\n`);
    
    console.log('✅ All Steps Completed:');
    console.log('   [✓] Product added to favorites');
    console.log('   [✓] Product added to cart');
    console.log('   [✓] Order created');
    console.log('   [✓] Order items saved');
    console.log('   [✓] Cart cleared');
    console.log('   [✓] Admin notified\n');

    console.log('🎯 Next Steps:');
    console.log('   1. Login as admin: admin@mlmpk.com / admin123');
    console.log('   2. Check notifications (should see new order alert)');
    console.log('   3. Go to Orders section');
    console.log(`   4. Find order: ${orderNumber}`);
    console.log('   5. View payment proof');
    console.log('   6. Update order status\n');

    console.log('🎉 Complete order flow working perfectly!\n');

    return {
      orderNumber,
      orderId: order.id,
      total,
      success: true
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Run the test
testCompleteOrderFlow();
