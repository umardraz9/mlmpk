const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        status: true,
        quantity: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n========== PRODUCTS IN DATABASE ==========\n');
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

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
