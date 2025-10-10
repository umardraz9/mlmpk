// Test using curl command
const { exec } = require('child_process');

// Generate unique email and phone per run
const ts = Date.now();
const email = `uroob+${ts}@example.com`;
const random9 = Math.floor(Math.random() * 1e9).toString().padStart(9, '0');
const phone = '03' + random9;
const payload = JSON.stringify({ name: 'uroob', email, phone, password: 'Demo@123456' });
const escaped = payload.replace(/"/g, '\\"');

const curlCommand = `curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "${escaped}" -v`;

console.log('Testing registration with curl...');
console.log('Command:', curlCommand);

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log('STDOUT:', stdout);
  console.log('STDERR:', stderr);
});
