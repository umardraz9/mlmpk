// Test the specific user credentials mentioned
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
            cookies: res.headers['set-cookie'] || []
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

async function testUserCredentials() {
  console.log('🔐 Testing Specific User Credentials...\n');
  
  try {
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/working-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    // Test sultan@mcnmart.com with password 12345678
    console.log('=== Testing sultan@mcnmart.com ===');
    const result = await makeRequest(loginOptions, {
      email: 'sultan@mcnmart.com',
      password: '12345678'
    });
    
    console.log('📊 Status:', result.status);
    console.log('📋 Response:', result.data);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Login successful!');
      console.log('👤 User:', result.data.user.name);
      console.log('📧 Email:', result.data.user.email);
      console.log('🎯 Redirect:', result.data.redirectUrl);
      
      // Test dashboard access
      const sessionCookie = result.cookies.find(c => c.includes('mlmpk-session='));
      if (sessionCookie) {
        const dashboardResult = await makeRequest({
          hostname: 'localhost',
          port: 3000,
          path: '/dashboard',
          method: 'GET',
          headers: { 'Cookie': sessionCookie }
        });
        
        console.log('📊 Dashboard Status:', dashboardResult.status);
        if (dashboardResult.status === 200) {
          console.log('✅ Dashboard access successful - no immediate logout!');
        } else {
          console.log('❌ Dashboard access failed');
        }
      }
    } else {
      console.log('❌ Login failed:', result.data.error || 'Unknown error');
    }
    
    console.log('\n🎉 User credential test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserCredentials();
