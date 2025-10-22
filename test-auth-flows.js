// Test both registration and login flows
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testRegistration() {
  console.log('🧪 Testing Registration Flow...\n');
  
  try {
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '03001234567',
      password: 'testpass123',
      referralCode: 'ADMIN001'
    };
    
    console.log('📝 Registering user:', testUser.email);
    
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    
    const data = await response.json();
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', data);
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      return testUser;
    } else {
      console.log('❌ Registration failed:', data.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return null;
  }
}

async function testLogin(email, password) {
  console.log('\n🔐 Testing Login Flow...\n');
  
  try {
    const loginData = { email, password };
    
    console.log('🔑 Logging in user:', email);
    
    const response = await fetch(`${BASE_URL}/api/working-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    const data = await response.json();
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', data);
    
    if (response.ok && data.success) {
      console.log('✅ Login successful!');
      console.log('👤 User:', data.user.name);
      console.log('📧 Email:', data.user.email);
      console.log('🎯 Redirect:', data.redirectUrl);
      return true;
    } else {
      console.log('❌ Login failed:', data.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Authentication Tests...\n');
  
  // Test 1: Admin Login
  console.log('=== TEST 1: Admin Login ===');
  const adminLoginSuccess = await testLogin('admin@mlmpk.com', 'admin123');
  
  // Test 2: Registration
  console.log('\n=== TEST 2: New User Registration ===');
  const registeredUser = await testRegistration();
  
  // Test 3: Login with new user
  if (registeredUser) {
    console.log('\n=== TEST 3: New User Login ===');
    await testLogin(registeredUser.email, registeredUser.password);
  }
  
  // Test 4: Invalid login
  console.log('\n=== TEST 4: Invalid Login ===');
  await testLogin('invalid@example.com', 'wrongpassword');
  
  console.log('\n🏁 All tests completed!');
}

// Wait a moment for server to be ready, then run tests
setTimeout(runTests, 2000);
