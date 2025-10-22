// Test login API directly
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

async function testLoginAPI() {
  console.log('🔐 Testing Login API...\n');
  
  try {
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/working-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Test 1: Sultan user login
    console.log('=== TEST 1: Sultan User Login ===');
    const sultanResult = await makeRequest(loginOptions, {
      email: 'sultan@mcnmart.com',
      password: '12345678'
    });
    
    console.log('📊 Status:', sultanResult.status);
    console.log('📋 Response:', sultanResult.data);
    console.log('🍪 Cookies:', sultanResult.cookies);
    
    if (sultanResult.status === 200 && sultanResult.data.success) {
      console.log('✅ Sultan login successful!');
      console.log('👤 User:', sultanResult.data.user.name);
      console.log('🎯 Redirect URL:', sultanResult.data.redirectUrl);
    } else {
      console.log('❌ Sultan login failed');
    }
    
    // Test 2: Admin user login
    console.log('\n=== TEST 2: Admin User Login ===');
    const adminResult = await makeRequest(loginOptions, {
      email: 'admin@mlmpk.com',
      password: 'admin123'
    });
    
    console.log('📊 Status:', adminResult.status);
    console.log('📋 Response:', adminResult.data);
    
    if (adminResult.status === 200 && adminResult.data.success) {
      console.log('✅ Admin login successful!');
      console.log('👤 User:', adminResult.data.user.name);
      console.log('🎯 Redirect URL:', adminResult.data.redirectUrl);
    } else {
      console.log('❌ Admin login failed');
    }
    
    // Test 3: Invalid credentials
    console.log('\n=== TEST 3: Invalid Credentials ===');
    const invalidResult = await makeRequest(loginOptions, {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    
    console.log('📊 Status:', invalidResult.status);
    console.log('📋 Response:', invalidResult.data);
    
    console.log('\n🏁 Login API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoginAPI();
