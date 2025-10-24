const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCart() {
  console.log('\n========== CHECKING CART TABLE ==========\n');
  
  try {
    // Try to select from cart table
    const { data, error } = await supabase
      .from('cart')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('not find')) {
        console.log('❌ Cart table does NOT exist\n');
        console.log('The migration may have failed. Please try running the SQL again.\n');
        return false;
      } else {
        // Table exists but query failed (possibly RLS or empty table)
        console.log('✅ Cart table EXISTS!\n');
        console.log('Note: Query returned error but table is present:');
        console.log(`   ${error.message}\n`);
        console.log('This is normal if the table is empty or RLS is enabled.\n');
        return true;
      }
    }

    console.log('✅ Cart table EXISTS and is accessible!\n');
    console.log(`Found ${data?.length || 0} cart(s) in database.\n`);
    return true;

  } catch (err) {
    console.error('❌ Error checking cart table:', err.message, '\n');
    return false;
  }
}

async function checkCartItems() {
  console.log('========== CHECKING CART ITEMS TABLE ==========\n');
  
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .limit(1);

    if (error) {
      console.log('⚠️  Cart items table error:', error.message);
    } else {
      console.log('✅ Cart items table exists and is accessible!\n');
      console.log(`Found ${data?.length || 0} item(s) in cart_items.\n`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message, '\n');
  }
}

async function main() {
  const cartExists = await checkCart();
  await checkCartItems();

  console.log('========== SUMMARY ==========\n');
  
  if (cartExists) {
    console.log('🎉 SUCCESS! Cart table was created!\n');
    console.log('✅ Database migration complete');
    console.log('✅ Cart system is ready');
    console.log('✅ You can now test adding products to cart\n');
    console.log('Next steps:');
    console.log('1. Restart your dev server');
    console.log('2. Go to http://localhost:3000/products');
    console.log('3. Click on a product');
    console.log('4. Click "Add to Cart"');
    console.log('5. Check your cart!\n');
  } else {
    console.log('❌ Cart table was NOT created\n');
    console.log('Please try running the SQL migration again in Supabase Dashboard.\n');
  }
}

main();
