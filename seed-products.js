const sqlite3 = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('crypto').randomUUID;

function generateId() {
  return require('crypto').randomBytes(12).toString('hex');
}

try {
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');
  console.log(`\nConnecting to database: ${dbPath}\n`);
  
  const db = new sqlite3(dbPath);
  
  // Create sample products
  const products = [
    {
      id: generateId(),
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'This is a test product for demonstration',
      price: 1500,
      comparePrice: 2000,
      costPrice: 800,
      sku: 'TEST-001',
      barcode: '1234567890',
      trackQuantity: 1,
      quantity: 50,
      minQuantity: 5,
      status: 'ACTIVE',
      images: JSON.stringify(['/placeholder.jpg']),
      weight: 0.5,
      dimensions: '10x10x10',
      categoryId: null,
      tags: JSON.stringify(['test', 'demo']),
      metaTitle: 'Test Product 1',
      metaDescription: 'A test product for demonstration',
      metaKeywords: 'test,product,demo',
      views: 0,
      sales: 0,
      rating: 4.5,
      reviewCount: 0,
      trending: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'New Test Post',
      slug: 'new-test-post',
      description: 'This is the product you were trying to access',
      price: 2500,
      comparePrice: 3500,
      costPrice: 1200,
      sku: 'TEST-002',
      barcode: '9876543210',
      trackQuantity: 1,
      quantity: 100,
      minQuantity: 1,
      status: 'ACTIVE',
      images: JSON.stringify(['/placeholder.jpg']),
      weight: 1.0,
      dimensions: '20x20x20',
      categoryId: null,
      tags: JSON.stringify(['new', 'featured']),
      metaTitle: 'New Test Post',
      metaDescription: 'A new test product',
      metaKeywords: 'new,test,post',
      views: 5,
      sales: 2,
      rating: 4.8,
      reviewCount: 5,
      trending: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Premium Product',
      slug: 'premium-product',
      description: 'A premium quality product with excellent features',
      price: 5000,
      comparePrice: 7000,
      costPrice: 2500,
      sku: 'PREM-001',
      barcode: '5555555555',
      trackQuantity: 1,
      quantity: 25,
      minQuantity: 1,
      status: 'ACTIVE',
      images: JSON.stringify(['/placeholder.jpg']),
      weight: 2.0,
      dimensions: '30x30x30',
      categoryId: null,
      tags: JSON.stringify(['premium', 'quality']),
      metaTitle: 'Premium Product',
      metaDescription: 'Premium quality product',
      metaKeywords: 'premium,quality,product',
      views: 150,
      sales: 10,
      rating: 4.9,
      reviewCount: 25,
      trending: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Insert products
  const insert = db.prepare(`
    INSERT INTO products (
      id, name, slug, description, price, comparePrice, costPrice, sku, barcode,
      trackQuantity, quantity, minQuantity, status, images, weight, dimensions,
      categoryId, tags, metaTitle, metaDescription, metaKeywords, views, sales,
      rating, reviewCount, trending, createdAt, updatedAt
    ) VALUES (
      @id, @name, @slug, @description, @price, @comparePrice, @costPrice, @sku, @barcode,
      @trackQuantity, @quantity, @minQuantity, @status, @images, @weight, @dimensions,
      @categoryId, @tags, @metaTitle, @metaDescription, @metaKeywords, @views, @sales,
      @rating, @reviewCount, @trending, @createdAt, @updatedAt
    )
  `);

  console.log('Seeding products...\n');
  products.forEach(product => {
    insert.run(product);
    console.log(`✓ Created: ${product.name} (${product.slug})`);
  });

  console.log('\n========== PRODUCTS CREATED ==========\n');
  
  // Verify
  const allProducts = db.prepare(`
    SELECT id, name, slug, price, status, quantity 
    FROM products 
    ORDER BY createdAt DESC
  `).all();

  console.log(`Total Products: ${allProducts.length}\n`);
  allProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name} (${product.slug})`);
    console.log(`   Price: ${product.price}, Stock: ${product.quantity}\n`);
  });

  db.close();
  console.log('✓ Database seeded successfully!');
} catch (error) {
  console.error('Error:', error.message);
}
