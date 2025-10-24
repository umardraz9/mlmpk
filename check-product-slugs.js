const sqlite3 = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');
  console.log(`\nChecking products in: ${dbPath}\n`);
  
  const db = new sqlite3(dbPath);
  
  // Get all products with their slugs
  const products = db.prepare(`
    SELECT id, name, slug, price, status, quantity 
    FROM products 
    ORDER BY createdAt DESC
  `).all();

  console.log('========== PRODUCTS AND SLUGS ==========\n');
  console.log(`Total Products: ${products.length}\n`);

  if (products.length === 0) {
    console.log('No products found in database.\n');
  } else {
    products.forEach((product, index) => {
      console.log(`${index + 1}. Name: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Slug: ${product.slug || 'NO SLUG!'}`);
      console.log(`   URL by ID: /products/${product.id}`);
      console.log(`   URL by Slug: /products/${product.slug || 'MISSING'}`);
      console.log(`   Price: ${product.price}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Stock: ${product.quantity}\n`);
    });

    // Check for products without slugs
    const noSlugs = products.filter(p => !p.slug);
    if (noSlugs.length > 0) {
      console.log('⚠️  WARNING: Products without slugs found:');
      noSlugs.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`);
      });
      console.log('\nThese products need slugs generated!\n');
    } else {
      console.log('✅ All products have slugs!\n');
    }
  }

  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
