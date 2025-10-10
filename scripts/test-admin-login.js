// Test admin login by calling the API route /api/auth/test-login
// Usage: node scripts/test-admin-login.js

const http = require('http');

function post(url, data) {
  return new Promise((resolve) => {
    const { hostname, port, pathname } = new URL(url);
    const body = JSON.stringify(data);

    const options = {
      hostname,
      port,
      path: pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = http.request(options, (res) => {
      let buf = '';
      res.on('data', (chunk) => (buf += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });

    req.on('error', (err) => resolve({ status: 0, body: String(err && err.message) }));
    req.write(body);
    req.end();
  });
}

(async () => {
  const ports = [3000, 3001];
  for (const port of ports) {
    const url = `http://127.0.0.1:${port}/api/auth/test-login`;
    const res = await post(url, { email: 'admin@mcnmart.com', password: 'admin123' });
    if (res.status) {
      console.log(`Port ${port} responded with status ${res.status}`);
      try {
        const json = JSON.parse(res.body);
        console.log('Response:', json);
      } catch (e) {
        console.log('Raw:', res.body);
      }
      process.exit(0);
    }
  }
  console.error('Failed to reach /api/auth/test-login on ports 3000 or 3001');
  process.exit(1);
})();
