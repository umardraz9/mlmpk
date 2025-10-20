// Test if Supabase project is accessible via API
const https = require('https');

const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

console.log('🔍 Testing Supabase Project Access...\n');
console.log('Project URL:', SUPABASE_URL);
console.log('Testing REST API endpoint...\n');

const options = {
  hostname: 'sfmeemhtjxwseuvzcjyd.supabase.co',
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
};

const req = https.request(options, (res) => {
  console.log('✅ Supabase API Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📊 Response:', data);
    
    if (res.statusCode === 200 || res.statusCode === 404) {
      console.log('\n✅ Supabase project IS ACTIVE and reachable!');
      console.log('\n⚠️  This means the database connection issue is with:');
      console.log('   1. Database password');
      console.log('   2. Database user configuration');
      console.log('   3. Project reference might have changed');
      console.log('\n📋 Action Required:');
      console.log('   Go to Supabase Dashboard → Settings (gear icon)');
      console.log('   → Database → Find "Connection string" section');
      console.log('   Copy the EXACT strings shown there');
    } else if (res.statusCode === 403) {
      console.log('\n⚠️  Supabase project exists but API key might be outdated');
    } else {
      console.log('\n❌ Unexpected response from Supabase');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Cannot reach Supabase:', error.message);
  console.error('\n🔧 Possible causes:');
  console.error('   1. Project is paused/deleted');
  console.error('   2. No internet connection');
  console.error('   3. Project reference changed');
  console.error('\nVisit: https://supabase.com/dashboard');
});

req.end();
