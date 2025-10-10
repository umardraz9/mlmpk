const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE'
      },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        trending: true,
        images: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${products.length} active products:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Slug: ${product.slug}`);
      console.log(`   Price: PKR ${product.price}`);
      console.log(`   Trending: ${product.trending}`);
      console.log(`   Image: ${product.images}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();
