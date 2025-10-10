// Simple test using fetch API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRegistration() {
  try {
    console.log('Testing registration API...');
    
    // Generate unique email and phone per run
    const ts = Date.now();
    const email = `uroob+${ts}@example.com`;
    const random9 = Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
    const phone = '03' + random9;

    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'uroob',
        email,
        phone,
        password: 'Demo@123456'
      })
    });

    console.log('Status:', response.status);
    
    const data = await response.text();
    console.log('Response:', data);
    
    if (response.status === 201) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRegistration();
