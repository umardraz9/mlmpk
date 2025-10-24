const sqlite3 = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');
  console.log(`\nConnecting to database: ${dbPath}\n`);
  
  const db = new sqlite3(dbPath);
  
  // Get all products
  const products = db.prepare(`
    SELECT id, name, slug, price, status, quantity 
    FROM products 
    ORDER BY createdAt DESC
  `).all();

  console.log('========== PRODUCTS IN DATABASE ==========\n');
  console.log(`Total Products: ${products.length}\n`);

  if (products.length === 0) {
    console.log('No products found in database.\n');
  } else {
    products.forEach((product, index) => {
      console.log(`${index + 1}. Name: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   Price: ${product.price}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Quantity: ${product.quantity}\n`);
    });
  }

  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
