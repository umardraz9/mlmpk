// Test registration with exact form data
const http = require('http');

// Generate unique email and phone per run
const ts = Date.now();
const email = `uroob+${ts}@example.com`;
const random9 = Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
const phone = '03' + random9; // Matches /^(
const testData = JSON.stringify({
  name: 'uroob',
  email,
  phone,
  password: 'Demo@123456'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('Testing registration with exact form data...');
console.log('Data:', JSON.parse(testData));

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', parsed);
      
      if (res.statusCode === 201) {
        console.log('✅ Registration successful!');
      } else {
        console.log('❌ Registration failed with status:', res.statusCode);
      }
    } catch (e) {
      console.log('❌ Could not parse response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
  console.error('Full error:', e);
});

req.write(testData);
req.end();
