// Verify membership plans API and print Premium price
// Usage: node scripts/verify-plans.js

const http = require('http');

function get(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', (err) => resolve({ status: 0, body: String(err && err.message) }));
  });
}

(async () => {
  const ports = [3000, 3001];
  for (const port of ports) {
    const url = `http://127.0.0.1:${port}/api/membership-plans`;
    const res = await get(url);
    if (res.status) {
      console.log(`Port ${port} responded with status ${res.status}`);
      try {
        const json = JSON.parse(res.body);
        const premium = (json.plans || []).find((p) => (p.name || '').toUpperCase() === 'PREMIUM');
        if (premium) {
          console.log('Premium plan:', { id: premium.id, price: premium.price, displayName: premium.displayName });
        } else {
          console.log('Premium plan not found in response');
        }
      } catch (e) {
        console.log('Response (raw):', res.body);
      }
      process.exit(0);
    }
  }
  console.error('Failed to reach /api/membership-plans on ports 3000 and 3001');
  process.exit(1);
})();
