// Debug the session issue by testing the complete flow
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

async function debugSessionIssue() {
  console.log('🔍 Debugging Session Issue...\n');
  
  try {
    // Step 1: Login
    console.log('=== STEP 1: Login ===');
    const loginResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/working-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'sultan@mcnmart.com',
      password: '12345678'
    });
    
    console.log('📊 Login Status:', loginResult.status);
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed');
      return;
    }
    
    const sessionCookie = loginResult.cookies.find(c => c.includes('mlmpk-session='));
    if (!sessionCookie) {
      console.log('❌ No session cookie in login response');
      return;
    }
    
    console.log('✅ Login successful, session cookie created');
    
    // Extract session data from cookie
    const cookieValue = sessionCookie.split('mlmpk-session=')[1].split(';')[0];
    const sessionData = JSON.parse(decodeURIComponent(cookieValue));
    console.log('📋 Session Data:', {
      user: sessionData.user.name,
      email: sessionData.user.email,
      expires: sessionData.expires,
      loginTime: sessionData.loginTime
    });
    
    // Step 2: Test dashboard access immediately
    console.log('\n=== STEP 2: Immediate Dashboard Access ===');
    const dashboardResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: { 
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('📊 Dashboard Status:', dashboardResult.status);
    
    if (dashboardResult.status === 200) {
      console.log('✅ Dashboard accessible via API');
    } else {
      console.log('❌ Dashboard not accessible via API');
    }
    
    // Step 3: Wait a moment and test again
    console.log('\n=== STEP 3: Dashboard Access After 2 Seconds ===');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dashboardResult2 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: { 
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('📊 Dashboard Status (after 2s):', dashboardResult2.status);
    
    // Step 4: Test the session validation endpoint if it exists
    console.log('\n=== STEP 4: Test Session Validation ===');
    
    // Check if there's a session validation endpoint
    const sessionCheckResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/session',
      method: 'GET',
      headers: { 
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('📊 Session Check Status:', sessionCheckResult.status);
    console.log('📋 Session Check Response:', sessionCheckResult.data);
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('- Login API: Working ✅');
    console.log('- Session Cookie: Created ✅');
    console.log('- Dashboard API Access:', dashboardResult.status === 200 ? 'Working ✅' : 'Failed ❌');
    console.log('- Session Persistence:', dashboardResult2.status === 200 ? 'Working ✅' : 'Failed ❌');
    
    if (dashboardResult.status === 200 && dashboardResult2.status === 200) {
      console.log('\n✅ Backend authentication is working correctly!');
      console.log('🔍 The issue might be in the frontend/browser:');
      console.log('   - Browser caching old JavaScript');
      console.log('   - React hydration issues');
      console.log('   - Client-side session reading problems');
      console.log('\n💡 Try:');
      console.log('   1. Hard refresh the browser (Ctrl+F5)');
      console.log('   2. Clear browser cache and cookies');
      console.log('   3. Open browser dev tools and check console errors');
      console.log('   4. Use the test page: /test-session-browser.html');
    } else {
      console.log('\n❌ Backend authentication has issues');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugSessionIssue();
