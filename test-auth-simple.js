// Simple test using built-in modules
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
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

async function testLogin() {
  console.log('🔐 Testing Admin Login...\n');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/working-login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const loginData = {
      email: 'admin@mlmpk.com',
      password: 'admin123'
    };
    
    console.log('🔑 Attempting login with:', loginData.email);
    
    const result = await makeRequest(options, loginData);
    console.log('📊 Status:', result.status);
    console.log('📋 Response:', result.data);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Login successful!');
      console.log('👤 User:', result.data.user.name);
      console.log('🎯 Redirect:', result.data.redirectUrl);
    } else {
      console.log('❌ Login failed:', result.data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Login test error:', error.message);
  }
}

async function testRegistration() {
  console.log('\n📝 Testing Registration...\n');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const userData = {
      name: 'Test User',
      email: 'testuser@example.com',
      phone: '03001234567',
      password: 'testpass123',
      referralCode: 'ADMIN001'
    };
    
    console.log('👤 Registering user:', userData.email);
    
    const result = await makeRequest(options, userData);
    console.log('📊 Status:', result.status);
    console.log('📋 Response:', result.data);
    
    if (result.status === 201) {
      console.log('✅ Registration successful!');
      console.log('👤 User ID:', result.data.user.id);
      console.log('🎫 Referral Code:', result.data.user.referralCode);
      return userData;
    } else {
      console.log('❌ Registration failed:', result.data.message || 'Unknown error');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Registration test error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Authentication Tests...\n');
  
  // Test admin login
  await testLogin();
  
  // Test registration
  const newUser = await testRegistration();
  
  // Test login with new user if registration succeeded
  if (newUser) {
    console.log('\n🔐 Testing New User Login...\n');
    
    try {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/working-login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      const result = await makeRequest(options, {
        email: newUser.email,
        password: newUser.password
      });
      
      console.log('📊 Status:', result.status);
      console.log('📋 Response:', result.data);
      
      if (result.status === 200 && result.data.success) {
        console.log('✅ New user login successful!');
      } else {
        console.log('❌ New user login failed:', result.data.error);
      }
      
    } catch (error) {
      console.error('❌ New user login test error:', error.message);
    }
  }
  
  console.log('\n🏁 All tests completed!');
}

// Wait for server to be ready
setTimeout(runTests, 1000);
