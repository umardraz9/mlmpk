// Test production authentication on Vercel
const https = require('https');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ 
            status: res.statusCode, 
            data: parsed, 
            headers: res.headers,
            cookies: res.headers['set-cookie'] || []
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testProductionAuth() {
  console.log('🔍 Testing Production Authentication on Vercel...\n');
  
  try {
    // Test 1: Check if login API exists
    console.log('=== TEST 1: Login API Availability ===');
    const loginResult = await makeRequest({
      hostname: 'mlmpk.vercel.app',
      port: 443,
      path: '/api/working-login',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, {
      email: 'sultan@mcnmart.com',
      password: '12345678'
    });
    
    console.log('📊 Login API Status:', loginResult.status);
    
    if (loginResult.status === 200) {
      console.log('✅ Login API working');
      console.log('📋 Response:', loginResult.data);
      
      // Check if session cookie is set
      const sessionCookie = loginResult.cookies.find(c => c.includes('mlmpk-session='));
      if (sessionCookie) {
        console.log('✅ Session cookie created');
        console.log('🍪 Cookie:', sessionCookie.substring(0, 100) + '...');
        
        // Test 2: Check dashboard access with session
        console.log('\n=== TEST 2: Dashboard Access ===');
        const dashboardResult = await makeRequest({
          hostname: 'mlmpk.vercel.app',
          port: 443,
          path: '/dashboard',
          method: 'GET',
          headers: { 
            'Cookie': sessionCookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log('📊 Dashboard Status:', dashboardResult.status);
        
        if (dashboardResult.status === 200) {
          console.log('✅ Dashboard accessible');
        } else {
          console.log('❌ Dashboard not accessible');
          console.log('📋 Response:', dashboardResult.data.substring(0, 200));
        }
        
      } else {
        console.log('❌ No session cookie created');
      }
      
    } else if (loginResult.status === 404) {
      console.log('❌ Login API not found - API route missing in production');
    } else {
      console.log('❌ Login failed');
      console.log('📋 Error:', loginResult.data);
    }
    
    // Test 3: Check if the issue is with environment variables
    console.log('\n=== TEST 3: Environment Check ===');
    console.log('💡 Possible issues:');
    console.log('   - SUPABASE_URL not set in Vercel environment');
    console.log('   - SUPABASE_ANON_KEY not set in Vercel environment');
    console.log('   - API routes not deployed properly');
    console.log('   - Session cookie settings incompatible with production');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProductionAuth();
