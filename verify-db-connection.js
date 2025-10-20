// Quick Database Connection Verification
// This tests if your Supabase database is reachable

const https = require('https');
const { URL } = require('url');

// Your Supabase connection details
const DATABASE_CONFIGS = {
  direct: 'postgresql://postgres:LKZC1GSTR3U7TnSz@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres',
  pooled: 'postgresql://postgres.sfmeemhtjxwseuvzcjyd:LKZC1GSTR3U7TnSz@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
};

console.log('🔍 Verifying Supabase Database Connection...\n');

// Test if Supabase API is reachable
const supabaseUrl = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
console.log(`1. Testing Supabase API: ${supabaseUrl}`);

https.get(supabaseUrl, (res) => {
  if (res.statusCode === 200 || res.statusCode === 404) {
    console.log('✅ Supabase API is reachable\n');
    
    console.log('2. Connection String Analysis:');
    console.log('   Direct URL:', DATABASE_CONFIGS.direct.replace(/:[^:@]+@/, ':****@'));
    console.log('   Pooled URL:', DATABASE_CONFIGS.pooled.replace(/:[^:@]+@/, ':****@'));
    console.log('\n⚠️  Database server test requires Prisma. Run:');
    console.log('   npx prisma db push --skip-generate');
    console.log('\n📋 Next Steps:');
    console.log('   1. Check Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Verify project "sfmeemhtjxwseuvzcjyd" is ACTIVE (not paused)');
    console.log('   3. Check Settings > Database > Connection string');
    console.log('   4. Ensure password matches: LKZC1GSTR3U7TnSz');
  } else {
    console.log('❌ Supabase API returned:', res.statusCode);
    console.log('⚠️  Your Supabase project might be paused or deleted!');
  }
}).on('error', (err) => {
  console.log('❌ Cannot reach Supabase:', err.message);
  console.log('\n🔧 Possible Causes:');
  console.log('   1. No internet connection');
  console.log('   2. Supabase is down (check status.supabase.com)');
  console.log('   3. Firewall blocking connection');
});
