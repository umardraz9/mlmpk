const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyMigration() {
  console.log('\n========== VERIFYING DATABASE MIGRATION ==========\n');

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
    'notifications',
    'notification_preferences',
    'notification_templates',
    'social_posts',
    'social_follows',
    'direct_messages',
    'friendships',
    'membership_plans',
    'password_resets'
  ];

  let existCount = 0;
  let missingCount = 0;
  const missing = [];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);

    if (error && (error.code === 'PGRST116' || error.message.includes('not exist') || error.message.includes('not find'))) {
      console.log(`❌ ${table.padEnd(25)} - MISSING`);
      missingCount++;
      missing.push(table);
    } else if (error) {
      console.log(`⚠️  ${table.padEnd(25)} - ERROR: ${error.message}`);
      missingCount++;
      missing.push(table);
    } else {
      console.log(`✅ ${table.padEnd(25)} - EXISTS`);
      existCount++;
    }
  }

  console.log('\n========== SUMMARY ==========\n');
  console.log(`✅ Existing: ${existCount}/${tables.length}`);
  console.log(`❌ Missing:  ${missingCount}/${tables.length}`);
  
  const percentage = Math.round((existCount / tables.length) * 100);
  console.log(`📊 Complete: ${percentage}%\n`);

  if (missingCount === 0) {
    console.log('🎉 SUCCESS! Database is 100% complete!\n');
    console.log('All systems ready:');
    console.log('✅ User Management');
    console.log('✅ Products & Categories');
    console.log('✅ Orders & Shopping');
    console.log('✅ Cart System');
    console.log('✅ Blog & Content');
    console.log('✅ Social Features');
    console.log('✅ Notifications');
    console.log('✅ Tasks & Membership\n');
    console.log('You can now use all features of the platform!\n');
    return true;
  } else {
    console.log('⚠️  Database is NOT complete.\n');
    console.log('Missing tables:');
    missing.forEach(t => console.log(`  - ${t}`));
    console.log('\nPlease run the SQL migration for missing tables.\n');
    return false;
  }
}

verifyMigration();
