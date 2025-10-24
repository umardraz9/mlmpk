const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyProducts() {
  console.log('\n========== SUPABASE PRODUCTS VERIFICATION ==========\n');
  console.log('Fetching products from Supabase...\n');

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ Error fetching products:', error.message);
      return;
    }

    console.log(`Total Products in Supabase: ${products.length}\n`);

    if (products.length === 0) {
      console.log('⚠️  No products found in Supabase.\n');
      console.log('This is normal if you haven\'t created products via admin yet.\n');
    } else {
      products.forEach((product, index) => {
        console.log(`${index + 1}. Name: ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Slug: ${product.slug || 'NO SLUG!'}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Price: ${product.price}`);
        console.log(`   Stock: ${product.quantity}`);
        console.log(`   URL by Slug: /products/${product.slug || 'MISSING'}`);
        console.log(`   URL by ID: /products/${product.id}\n`);
      });

      // Check for products without slugs
      const noSlugs = products.filter(p => !p.slug);
      if (noSlugs.length > 0) {
        console.log('\n⚠️  WARNING: Products without slugs:');
        noSlugs.forEach(p => {
          console.log(`   - ${p.name} (ID: ${p.id})`);
        });
        console.log('\nThese need slugs generated!\n');
      } else {
        console.log('✅ All products have slugs!\n');
      }
    }

    // Check cart table exists
    console.log('\n========== CHECKING CART TABLES ==========\n');
    
    const { error: cartError } = await supabase
      .from('cart')
      .select('id')
      .limit(1);

    if (cartError) {
      console.log('❌ Cart table:', cartError.message);
    } else {
      console.log('✅ Cart table exists');
    }

    const { error: cartItemsError } = await supabase
      .from('cart_items')
      .select('id')
      .limit(1);

    if (cartItemsError) {
      console.log('❌ Cart items table:', cartItemsError.message);
    } else {
      console.log('✅ Cart items table exists');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

verifyProducts();
