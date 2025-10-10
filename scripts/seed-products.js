const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedProducts() {
  try {
    console.log('🌱 Seeding products...');
    
    // Create some sample products
    const products = [
      {
        name: 'Business Starter Kit',
        slug: 'business-starter-kit',
        description: 'Everything you need to start your business journey with MCNmart. Includes training materials, marketing templates, and success guides.',
        price: 2500,
        comparePrice: 3500,
        images: '/images/products/business-kit.svg',
        status: 'ACTIVE',
        trending: true,
        categoryId: null,
        rating: 4.8,
        reviewCount: 124,
        sales: 245,
        quantity: 100
      },
      {
        name: 'Digital Marketing Mastery Course',
        slug: 'digital-marketing-mastery-course',
        description: 'Comprehensive digital marketing course designed for business partners. Learn social media strategies, email marketing, and content creation.',
        price: 3500,
        comparePrice: 5000,
        images: '/images/products/marketing-course.svg',
        status: 'ACTIVE',
        trending: true,
        categoryId: null,
        rating: 4.9,
        reviewCount: 89,
        sales: 178,
        quantity: 50
      },
      {
        name: 'Success Journal & Planner',
        slug: 'success-journal-planner',
        description: 'Premium journal designed to help you track your business progress, set goals, and plan your daily activities for maximum success.',
        price: 1200,
        comparePrice: 1800,
        images: '/images/products/success-journal.svg',
        status: 'ACTIVE',
        trending: true,
        categoryId: null,
        rating: 4.7,
        reviewCount: 67,
        sales: 156,
        quantity: 75
      },
      {
        name: 'Leadership Development Program',
        slug: 'leadership-development-program',
        description: 'Advanced leadership training for top-tier MCNmart partners. Develop your team management and motivational skills.',
        price: 4500,
        comparePrice: 6500,
        images: '/images/products/business-kit.svg',
        status: 'ACTIVE',
        trending: false,
        categoryId: null,
        rating: 4.6,
        reviewCount: 45,
        sales: 89,
        quantity: 25
      },
      {
        name: 'Social Media Marketing Toolkit',
        slug: 'social-media-marketing-toolkit',
        description: 'Complete toolkit for social media marketing success. Includes templates, schedulers, and analytics tools.',
        price: 2000,
        comparePrice: 3000,
        images: '/images/products/marketing-course.svg',
        status: 'ACTIVE',
        trending: false,
        categoryId: null,
        rating: 4.5,
        reviewCount: 78,
        sales: 134,
        quantity: 60
      }
    ];
    
    for (const productData of products) {
      const existingProduct = await prisma.product.findFirst({
        where: { slug: productData.slug }
      });
      
      if (!existingProduct) {
        const product = await prisma.product.create({
          data: productData
        });
        console.log(`✅ Created product: ${product.name}`);
      } else {
        console.log(`🔄 Product already exists: ${existingProduct.name}`);
      }
    }
    
    console.log('\n✅ Products seeded successfully!');
    
    // Show summary
    const totalProducts = await prisma.product.count();
    console.log(`\n📊 Total products in database: ${totalProducts}`);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('\n🎉 Product seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Product seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProducts };
