// Registration E2E test that tries ports 3000 and 3001 with retries
// Usage: node scripts/test-registration.js

const http = require('http');

function requestRegister(port, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 8000,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ ok: true, status: res.statusCode, body }));
    });

    req.on('error', (err) => resolve({ ok: false, error: err && (err.message || JSON.stringify({ code: err.code, errno: err.errno, syscall: err.syscall, address: err.address, port: err.port })) }));
    req.on('timeout', () => {
      req.abort();
      resolve({ ok: false, error: 'timeout' });
    });

    req.write(data);
    req.end();
  });
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const ts = Date.now();
  const email = `e2e+${ts}@example.com`;
  const random9 = Math.floor(Math.random() * 1e9)
    .toString()
    .padStart(9, '0');
  const phone = '03' + random9; // valid PK number format
  const payload = { name: 'E2E User', email, phone, password: 'Demo@123456' };

  const ports = [3000, 3001];
  const maxRetries = 10;

  console.log('Registration E2E starting...');
  console.log('Payload:', payload);

  for (const port of ports) {
    console.log(`\nTrying port ${port} ...`);
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const res = await requestRegister(port, payload);
      if (res.ok) {
        console.log(`Attempt ${attempt} on port ${port} responded: status=${res.status}`);
        console.log('Body:', res.body);
        if (res.status === 201) {
          console.log('✅ Registration successful!');
          process.exit(0);
        } else if (res.status === 409) {
          console.log('ℹ️ Already exists (409). Using unique data per run should avoid this.');
          process.exit(0);
        } else {
          console.log('Non-201 response, will retry...');
        }
      } else {
        console.log(`Attempt ${attempt} on port ${port} failed: ${res.error}`);
      }
      await wait(1000);
    }
  }

  console.error('\n❌ Registration E2E failed on both ports after retries.');
  process.exit(1);
}

main();
