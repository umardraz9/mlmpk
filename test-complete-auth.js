// Complete authentication flow test
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

async function testCompleteFlow() {
  console.log('🚀 Testing Complete Authentication Flow...\n');
  
  try {
    // Test 1: Admin Login
    console.log('=== TEST 1: Admin Login ===');
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/working-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const loginResult = await makeRequest(loginOptions, {
      email: 'admin@mlmpk.com',
      password: 'admin123'
    });
    
    console.log('📊 Login Status:', loginResult.status);
    console.log('📋 Login Response:', loginResult.data);
    console.log('🍪 Cookies Set:', loginResult.cookies);
    
    if (loginResult.status === 200 && loginResult.data.success) {
      console.log('✅ Admin login successful!');
      console.log('👤 User:', loginResult.data.user.name);
      console.log('🎯 Redirect URL:', loginResult.data.redirectUrl);
      
      // Extract session cookie
      const sessionCookie = loginResult.cookies.find(cookie => 
        cookie.includes('mlmpk-session=')
      );
      
      if (sessionCookie) {
        console.log('🍪 Session cookie created successfully');
        
        // Test 2: Access Dashboard with Session
        console.log('\n=== TEST 2: Dashboard Access ===');
        const dashboardOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/dashboard',
          method: 'GET',
          headers: {
            'Cookie': sessionCookie
          }
        };
        
        const dashboardResult = await makeRequest(dashboardOptions);
        console.log('📊 Dashboard Status:', dashboardResult.status);
        
        if (dashboardResult.status === 200) {
          console.log('✅ Dashboard access successful!');
        } else {
          console.log('❌ Dashboard access failed');
        }
      } else {
        console.log('❌ No session cookie found');
      }
    } else {
      console.log('❌ Admin login failed');
    }
    
    // Test 3: New User Registration
    console.log('\n=== TEST 3: New User Registration ===');
    const registerOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const timestamp = Date.now();
    const registerResult = await makeRequest(registerOptions, {
      name: 'Test User',
      email: `testuser${timestamp}@example.com`,
      phone: '03001234567',
      password: 'testpass123',
      referralCode: 'ADMIN001'
    });
    
    console.log('📊 Registration Status:', registerResult.status);
    console.log('📋 Registration Response:', registerResult.data);
    
    if (registerResult.status === 201) {
      console.log('✅ Registration successful!');
      
      // Test 4: New User Login
      console.log('\n=== TEST 4: New User Login ===');
      const newUserLoginResult = await makeRequest(loginOptions, {
        email: `testuser${timestamp}@example.com`,
        password: 'testpass123'
      });
      
      console.log('📊 New User Login Status:', newUserLoginResult.status);
      console.log('📋 New User Login Response:', newUserLoginResult.data);
      
      if (newUserLoginResult.status === 200 && newUserLoginResult.data.success) {
        console.log('✅ New user login successful!');
        console.log('👤 User:', newUserLoginResult.data.user.name);
        console.log('🎯 Redirect URL:', newUserLoginResult.data.redirectUrl);
      } else {
        console.log('❌ New user login failed');
      }
    } else {
      console.log('❌ Registration failed');
    }
    
    console.log('\n🏁 Complete authentication flow test finished!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait for server to be ready
setTimeout(testCompleteFlow, 1000);
