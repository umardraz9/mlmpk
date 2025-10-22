// Test dashboard access with session cookie
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          data: body, 
          headers: res.headers,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testDashboardAccess() {
  console.log('🏠 Testing Dashboard Access Flow...\n');
  
  try {
    // Step 1: Login to get session cookie
    console.log('=== STEP 1: Login ===');
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
      email: 'sultan@mcnmart.com',
      password: '12345678'
    });
    
    console.log('📊 Login Status:', loginResult.status);
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed, cannot test dashboard');
      return;
    }
    
    // Extract session cookie
    const sessionCookie = loginResult.cookies.find(cookie => 
      cookie.includes('mlmpk-session=')
    );
    
    if (!sessionCookie) {
      console.log('❌ No session cookie found');
      return;
    }
    
    console.log('✅ Login successful, session cookie obtained');
    console.log('🍪 Cookie:', sessionCookie.substring(0, 50) + '...');
    
    // Step 2: Access dashboard with session cookie
    console.log('\n=== STEP 2: Dashboard Access ===');
    const dashboardOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    const dashboardResult = await makeRequest(dashboardOptions);
    console.log('📊 Dashboard Status:', dashboardResult.status);
    
    if (dashboardResult.status === 200) {
      console.log('✅ Dashboard loaded successfully!');
      
      // Check if it contains dashboard content or login redirect
      if (dashboardResult.data.includes('Welcome back') || dashboardResult.data.includes('Dashboard')) {
        console.log('✅ Dashboard content detected - session working!');
      } else if (dashboardResult.data.includes('login') || dashboardResult.data.includes('sign in')) {
        console.log('❌ Dashboard redirected to login - session not working');
      } else {
        console.log('⚠️  Dashboard loaded but content unclear');
      }
    } else if (dashboardResult.status === 302 || dashboardResult.status === 301) {
      console.log('❌ Dashboard redirected (status', dashboardResult.status + ')');
      console.log('🔄 Redirect location:', dashboardResult.headers.location);
    } else {
      console.log('❌ Dashboard access failed with status:', dashboardResult.status);
    }
    
    // Step 3: Test admin dashboard access
    console.log('\n=== STEP 3: Admin Dashboard Test ===');
    const adminLoginResult = await makeRequest(loginOptions, {
      email: 'admin@mlmpk.com',
      password: 'admin123'
    });
    
    if (adminLoginResult.status === 200) {
      const adminSessionCookie = adminLoginResult.cookies.find(cookie => 
        cookie.includes('mlmpk-session=')
      );
      
      if (adminSessionCookie) {
        const adminDashboardOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/admin/dashboard',
          method: 'GET',
          headers: {
            'Cookie': adminSessionCookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        };
        
        const adminDashboardResult = await makeRequest(adminDashboardOptions);
        console.log('📊 Admin Dashboard Status:', adminDashboardResult.status);
        
        if (adminDashboardResult.status === 200) {
          console.log('✅ Admin dashboard accessible!');
        } else {
          console.log('❌ Admin dashboard access failed');
        }
      }
    }
    
    console.log('\n🏁 Dashboard access test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDashboardAccess();
