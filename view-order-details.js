const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ORDER_NUMBER = 'MCN1761242409873EUF5';

async function viewOrderDetails() {
  console.log('\n========== ORDER DETAILS ==========\n');
  console.log(`Fetching order: ${ORDER_NUMBER}\n`);

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('orderNumber', ORDER_NUMBER)
      .single();

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }

    if (!order) {
      console.log('❌ Order not found');
      return;
    }

    console.log('✅ Order Found!\n');
    console.log('─'.repeat(60));
    console.log(`Order Number:     ${order.orderNumber}`);
    console.log(`Order ID:         ${order.id}`);
    console.log(`Customer Email:   ${order.email}`);
    console.log(`Status:           ${order.status}`);
    console.log('─'.repeat(60));
    console.log(`Subtotal:         PKR ${order.subtotalPkr}`);
    console.log(`Shipping:         PKR ${order.shippingPkr}`);
    console.log(`Voucher Used:     PKR ${order.voucherUsedPkr || 0}`);
    console.log(`TOTAL:            PKR ${order.totalPkr}`);
    console.log('─'.repeat(60));
    console.log(`Payment Method:   ${order.paymentMethod}`);
    console.log(`Payment Proof:    ${order.paymentProof || 'Not submitted'}`);
    console.log('─'.repeat(60));
    console.log(`Shipping Address: ${order.shippingAddress}`);
    console.log(`City:             ${order.city}`);
    console.log(`Province:         ${order.province || 'N/A'}`);
    console.log(`Postal Code:      ${order.postalCode || 'N/A'}`);
    console.log(`Phone:            ${order.phone}`);
    console.log('─'.repeat(60));
    console.log(`Notes:            ${order.notes || 'None'}`);
    console.log(`Created:          ${new Date(order.createdAt).toLocaleString()}`);
    console.log('─'.repeat(60));

    // Get order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*, product:products(*)')
      .eq('orderId', order.id);

    console.log('\n📦 Order Items:\n');
    if (items && items.length > 0) {
      items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.product?.name || 'Unknown Product'}`);
        console.log(`   Quantity: ${item.quantity}`);
        console.log(`   Price: PKR ${item.pricePkr}`);
        console.log(`   Total: PKR ${item.pricePkr * item.quantity}\n`);
      });
    } else {
      console.log('No items found (this is normal if cart was empty)\n');
    }

    console.log('─'.repeat(60));
    console.log('\n✅ Order is ready for admin review!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

viewOrderDetails();
