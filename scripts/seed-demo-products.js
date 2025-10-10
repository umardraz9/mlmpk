const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedDemoProducts() {
  console.log('🌱 Seeding demo products...')

  try {
    // Demo products with different categories
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
        featured: false,
        trending: true,
        rating: 4.7,
        reviewCount: 234,
        specifications: JSON.stringify({
          'Pages': '365 pages (one year)',
          'Size': 'A5 (148 x 210 mm)',
          'Cover': 'Premium hardcover',
          'Paper': 'High-quality 120gsm',
          'Binding': 'Lay-flat binding'
        }),
        features: JSON.stringify([
          'Daily goal setting pages',
          'Weekly and monthly reviews',
          'Habit tracking sections',
          'Inspirational quotes',
          'Progress visualization charts'
        ])
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
        featured: true,
        trending: false,
        rating: 4.5,
        reviewCount: 112,
        specifications: JSON.stringify({
          'Platforms': 'Facebook, Instagram, Twitter, LinkedIn',
          'Templates': '500+ post templates',
          'Tools': 'Scheduling and analytics tools',
          'Format': 'Digital download + online access',
          'Support': '6 months email support'
        }),
        features: JSON.stringify([
          'Ready-to-use post templates',
          'Content calendar templates',
          'Hashtag research tools',
          'Analytics tracking sheets',
          'Growth strategy guides'
        ])
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
        featured: false,
        trending: true,
        rating: 4.9,
        reviewCount: 67,
        specifications: JSON.stringify({
          'Documents': '50+ legal and business templates',
          'Format': 'Editable Word/PDF files',
          'Bonus': 'Free consultation call',
          'Updates': 'Annual template updates',
          'Support': 'Priority email support'
        }),
        features: JSON.stringify([
          'Business plan templates',
          'Legal document templates',
          'Marketing material templates',
          'Financial planning worksheets',
          'Pitch deck templates'
        ])
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
        featured: false,
        trending: false,
        rating: 4.4,
        reviewCount: 198,
        specifications: JSON.stringify({
          'Duration': '8 weeks',
          'Lessons': '24 video lessons',
          'Workbook': '100+ page workbook',
          'Tools': 'Productivity tracking apps',
          'Community': 'Private Facebook group'
        }),
        features: JSON.stringify([
          'Time blocking techniques',
          'Habit stacking methods',
          'Energy management strategies',
          'Focus improvement techniques',
          'Productivity tracking tools'
        ])
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

    // Show featured and trending products
    const featuredCount = await prisma.product.count({ where: { featured: true } })
    const trendingCount = await prisma.product.count({ where: { trending: true } })
    
    console.log(`   ⭐ Featured products: ${featuredCount}`)
    console.log(`   🔥 Trending products: ${trendingCount}`)

  } catch (error) {
    console.error('❌ Error seeding demo products:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedDemoProducts()
    .then(() => {
      console.log('\n🎉 Product seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Product seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedDemoProducts }
