const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tables that should exist based on Prisma schema
const expectedTables = [
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

async function checkTables() {
  console.log('\n========== SUPABASE DATABASE CHECK ==========\n');
  console.log('Checking which tables exist...\n');

  const existingTables = [];
  const missingTables = [];

  for (const tableName of expectedTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('not find')) {
          console.log(`❌ ${tableName.padEnd(25)} - MISSING`);
          missingTables.push(tableName);
        } else {
          console.log(`⚠️  ${tableName.padEnd(25)} - ERROR: ${error.message}`);
        }
      } else {
        console.log(`✅ ${tableName.padEnd(25)} - EXISTS`);
        existingTables.push(tableName);
      }
    } catch (err) {
      console.log(`⚠️  ${tableName.padEnd(25)} - ERROR: ${err.message}`);
    }
  }

  console.log('\n========== SUMMARY ==========\n');
  console.log(`✅ Existing Tables: ${existingTables.length}`);
  console.log(`❌ Missing Tables:  ${missingTables.length}\n`);

  if (missingTables.length > 0) {
    console.log('Missing Tables:');
    missingTables.forEach(table => {
      console.log(`  - ${table}`);
    });
    console.log('\nThese tables need to be created!\n');
  } else {
    console.log('🎉 All expected tables exist!\n');
  }

  return { existingTables, missingTables };
}

checkTables();
