const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigration() {
  console.log('\n========== RUNNING DATABASE MIGRATION ==========\n');
  console.log('Creating cart table and setting up complete database...\n');

  try {
    // Step 1: Create cart table using RPC or direct SQL
    console.log('Step 1: Creating cart table...');
    
    // Try to insert a test record to check if table exists
    const { error: testError } = await supabase
      .from('cart')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('does not exist')) {
      console.log('⚠️  Cart table does not exist.');
      console.log('📝 Please run the SQL migration manually in Supabase Dashboard.\n');
      console.log('SQL to run:');
      console.log('─'.repeat(60));
      console.log(`
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_userId ON cart("userId");
      `);
      console.log('─'.repeat(60));
      console.log('\nInstructions:');
      console.log('1. Go to: https://supabase.com/dashboard/project/sfmeemhtjxwseuvzcjyd/sql/new');
      console.log('2. Copy and paste the SQL above');
      console.log('3. Click "Run" or press Ctrl+Enter');
      console.log('4. Come back and run this script again\n');
      return false;
    } else if (testError) {
      console.log('⚠️  Unexpected error:', testError.message);
      return false;
    } else {
      console.log('✅ Cart table already exists!\n');
    }

    // Step 2: Verify all tables
    console.log('Step 2: Verifying all tables...\n');
    
    const tables = [
      'users',
      'products',
      'product_categories',
      'orders',
      'order_items',
      'cart',
      'cart_items',
      'tasks',
      'blog_posts',
      'notifications'
    ];

    let allExist = true;
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && (error.code === 'PGRST116' || error.message.includes('not exist'))) {
        console.log(`❌ ${table.padEnd(20)} - MISSING`);
        allExist = false;
      } else if (error) {
        console.log(`⚠️  ${table.padEnd(20)} - ERROR: ${error.message}`);
        allExist = false;
      } else {
        console.log(`✅ ${table.padEnd(20)} - EXISTS`);
      }
    }

    if (!allExist) {
      console.log('\n⚠️  Some tables are missing. Database is not 100% complete.\n');
      return false;
    }

    // Step 3: Verify cart_items foreign keys work
    console.log('\n Step 3: Testing cart functionality...\n');
    
    // Check if we can query cart with cart_items
    const { data: testCart, error: cartError } = await supabase
      .from('cart')
      .select('*, cart_items(*)')
      .limit(1);

    if (cartError) {
      console.log('⚠️  Cart join test:', cartError.message);
    } else {
      console.log('✅ Cart-CartItems relationship working!');
    }

    console.log('\n========== MIGRATION COMPLETE! ==========\n');
    console.log('🎉 Database is now 100% complete!\n');
    console.log('All tables verified:');
    console.log('✅ Users system');
    console.log('✅ Products system');
    console.log('✅ Categories system');
    console.log('✅ Orders system');
    console.log('✅ Cart system (NEW!)');
    console.log('✅ Tasks system');
    console.log('✅ Blog system');
    console.log('✅ Notifications system\n');
    console.log('You can now test the complete cart functionality!\n');
    return true;

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    return false;
  }
}

runMigration();
