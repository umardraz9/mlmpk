const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedSimpleProducts() {
  console.log('🌱 Seeding demo products...')

  try {
    // Simple products that match the exact Prisma schema
    const products = [
      {
        name: 'Digital Marketing Mastery Course',
        slug: 'digital-marketing-course',
        description: 'Complete digital marketing course covering social media, SEO, email marketing, and paid advertising. Perfect for beginners and professionals.',
        price: 2500.0,
        comparePrice: 4000.0,
        costPrice: 1000.0,
        category: 'Courses',
        tags: 'marketing,digital,course,online',
        images: '/images/products/marketing-course.jpg',
        quantity: 100,
        status: 'ACTIVE',
        trending: true,
        rating: 4.8,
        reviewCount: 156,
        views: 1250,
        sales: 89
      },
      {
        name: 'MLM Success Business Kit',
        slug: 'mlm-business-kit',
        description: 'Everything you need to build a successful MLM business. Includes training materials, templates, and proven strategies.',
        price: 1500.0,
        comparePrice: 2500.0,
        costPrice: 600.0,
        category: 'Business Tools',
        tags: 'mlm,business,kit,templates',
        images: '/images/products/business-kit.jpg',
        quantity: 50,
        status: 'ACTIVE',
        trending: false,
        rating: 4.6,
        reviewCount: 89,
        views: 890,
        sales: 45
      },
      {
        name: 'Personal Success Journal',
        slug: 'success-journal',
        description: 'A beautifully designed journal to track your goals, achievements, and daily progress. Perfect for personal development.',
        price: 800.0,
        comparePrice: 1200.0,
        costPrice: 300.0,
        category: 'Personal Development',
        tags: 'journal,goals,success,planner',
        images: '/images/products/success-journal.jpg',
        quantity: 200,
        status: 'ACTIVE',
        trending: true,
        rating: 4.7,
        reviewCount: 234,
        views: 2340,
        sales: 123
      },
      {
        name: 'Social Media Growth Bundle',
        slug: 'social-media-bundle',
        description: 'Complete social media growth package with templates, content ideas, and automation tools for all major platforms.',
        price: 1800.0,
        comparePrice: 3000.0,
        costPrice: 700.0,
        category: 'Digital Tools',
        tags: 'social media,templates,growth,automation',
        images: '/images/products/social-media-bundle.jpg',
        quantity: 75,
        status: 'ACTIVE',
        trending: false,
        rating: 4.5,
        reviewCount: 112,
        views: 1120,
        sales: 67
      },
      {
        name: 'Entrepreneur Starter Pack',
        slug: 'entrepreneur-starter-pack',
        description: 'Essential tools and resources for new entrepreneurs. Includes business plan templates, legal documents, and marketing materials.',
        price: 2200.0,
        comparePrice: 3500.0,
        costPrice: 900.0,
        category: 'Business Tools',
        tags: 'entrepreneur,startup,business plan,legal',
        images: '/images/products/entrepreneur-pack.jpg',
        quantity: 40,
        status: 'ACTIVE',
        trending: true,
        rating: 4.9,
        reviewCount: 67,
        views: 670,
        sales: 34
      },
      {
        name: 'Productivity Masterclass',
        slug: 'productivity-masterclass',
        description: 'Learn proven productivity techniques used by successful entrepreneurs. Includes time management tools and habit-building strategies.',
        price: 1200.0,
        comparePrice: 2000.0,
        costPrice: 500.0,
        category: 'Courses',
        tags: 'productivity,time management,habits,efficiency',
        images: '/images/products/productivity-course.jpg',
        quantity: 120,
        status: 'ACTIVE',
        trending: false,
        rating: 4.4,
        reviewCount: 198,
        views: 1980,
        sales: 98
      }
    ]

    console.log('\n📦 Creating demo products...')

    for (const productData of products) {
      const existingProduct = await prisma.product.findFirst({
        where: { slug: productData.slug }
      })

      if (!existingProduct) {
        const product = await prisma.product.create({
          data: productData
        })
        console.log(`✅ Created product: ${product.name} (PKR ${product.price})`)
      } else {
        console.log(`🔄 Product already exists: ${existingProduct.name}`)
      }
    }

    console.log('\n✅ Demo products seeded successfully!')
    
    // Show summary
    const totalProducts = await prisma.product.count()
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    })
    
    console.log(`\n📊 Summary:`)
    console.log(`   📦 Total products: ${totalProducts}`)
    console.log(`   📂 Categories:`)
    categories.forEach(cat => {
      console.log(`      - ${cat.category}: ${cat._count.category} products`)
    })

    // Show trending products
    const trendingCount = await prisma.product.count({ where: { trending: true } })
    const activeCount = await prisma.product.count({ where: { status: 'ACTIVE' } })
    
    console.log(`   🔥 Trending products: ${trendingCount}`)
    console.log(`   ✅ Active products: ${activeCount}`)

  } catch (error) {
    console.error('❌ Error seeding demo products:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedSimpleProducts()
    .then(() => {
      console.log('\n🎉 Product seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Product seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedSimpleProducts }
