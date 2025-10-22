// Test admin dashboard specifically
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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

async function testAdminOnly() {
  console.log('👑 Testing Admin Dashboard Access...\n');
  
  try {
    // Step 1: Admin Login
    console.log('=== STEP 1: Admin Login ===');
    const loginResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/working-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@mlmpk.com',
      password: 'admin123'
    });
    
    console.log('📊 Login Status:', loginResult.status);
    console.log('🎯 Redirect URL:', loginResult.data.redirectUrl);
    
    if (loginResult.status !== 200) {
      console.log('❌ Admin login failed');
      return;
    }
    
    console.log('✅ Admin login successful!');
    
    // Step 2: Access Admin Dashboard
    console.log('\n=== STEP 2: Admin Dashboard Access ===');
    const sessionCookie = loginResult.cookies.find(c => c.includes('mlmpk-session='));
    
    if (!sessionCookie) {
      console.log('❌ No session cookie found');
      return;
    }
    
    console.log('🍪 Session cookie found');
    
    const dashboardResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin',
      method: 'GET',
      headers: { 
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('📊 Admin Dashboard Status:', dashboardResult.status);
    
    if (dashboardResult.status === 200) {
      console.log('✅ Admin dashboard loaded successfully!');
      
      // Check if it contains admin content
      if (typeof dashboardResult.data === 'string') {
        if (dashboardResult.data.includes('Admin') || dashboardResult.data.includes('Dashboard')) {
          console.log('✅ Admin dashboard content detected!');
        } else {
          console.log('⚠️  Admin dashboard loaded but content unclear');
        }
      }
    } else if (dashboardResult.status === 500) {
      console.log('❌ Admin dashboard returned 500 error');
      console.log('🔍 This might be due to another component using NextAuth');
    } else {
      console.log('❌ Admin dashboard access failed with status:', dashboardResult.status);
    }
    
    console.log('\n🏁 Admin dashboard test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminOnly();
