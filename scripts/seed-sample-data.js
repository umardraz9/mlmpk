const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedSampleData() {
  try {
    console.log('🌱 Seeding sample data...')

    // Create blog categories
    const categories = await Promise.all([
      prisma.blogCategory.upsert({
        where: { slug: 'business' },
        update: {},
        create: {
          name: 'Business',
          slug: 'business',
          description: 'Business tips and strategies',
          color: '#3B82F6'
        }
      }),
      prisma.blogCategory.upsert({
        where: { slug: 'technology' },
        update: {},
        create: {
          name: 'Technology',
          slug: 'technology',
          description: 'Latest tech trends',
          color: '#10B981'
        }
      }),
      prisma.blogCategory.upsert({
        where: { slug: 'lifestyle' },
        update: {},
        create: {
          name: 'Lifestyle',
          slug: 'lifestyle',
          description: 'Lifestyle and personal development',
          color: '#F59E0B'
        }
      })
    ])

    // Get demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demouser@example.com' }
    })

    if (!demoUser) {
      throw new Error('Demo user not found. Please run create-demo-user.js first.')
    }

    // Create blog posts
    const blogPosts = [
      {
        title: 'Starting Your Online Business in Pakistan',
        slug: 'starting-online-business-pakistan',
        content: 'Complete guide to starting an online business in Pakistan with practical tips and strategies.',
        excerpt: 'Learn how to start your online business in Pakistan with this comprehensive guide.',
        featuredImage: '/images/blog/online-business-pakistan.jpg',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: categories[0].id,
        authorId: demoUser.id,
        views: 245,
        likes: 18
      },
      {
        title: 'Digital Marketing Strategies for Pakistani Businesses',
        slug: 'digital-marketing-strategies-pakistan',
        content: 'Effective digital marketing strategies tailored for the Pakistani market.',
        excerpt: 'Discover proven digital marketing strategies that work in Pakistan.',
        featuredImage: '/images/blog/digital-marketing.jpg',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: categories[0].id,
        authorId: demoUser.id,
        views: 189,
        likes: 24
      },
      {
        title: 'Technology Trends in Pakistan 2024',
        slug: 'technology-trends-pakistan-2024',
        content: 'Latest technology trends and innovations in Pakistan for 2024.',
        excerpt: 'Stay updated with the latest technology trends in Pakistan.',
        featuredImage: '/images/blog/tech-trends.jpg',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        categoryId: categories[1].id,
        authorId: demoUser.id,
        views: 156,
        likes: 12
      }
    ]

    for (const post of blogPosts) {
      await prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: {},
        create: post
      })
    }

    // Create product categories
    const productCategories = await Promise.all([
      prisma.productCategory.upsert({
        where: { slug: 'courses' },
        update: {},
        create: {
          name: 'Courses',
          slug: 'courses',
          color: '#3B82F6'
        }
      }),
      prisma.productCategory.upsert({
        where: { slug: 'business-tools' },
        update: {},
        create: {
          name: 'Business Tools',
          slug: 'business-tools',
          color: '#10B981'
        }
      }),
      prisma.productCategory.upsert({
        where: { slug: 'digital-products' },
        update: {},
        create: {
          name: 'Digital Products',
          slug: 'digital-products',
          color: '#F59E0B'
        }
      })
    ])

    // Create products
    const products = [
      {
        name: 'Digital Marketing Mastery Course',
        slug: 'digital-marketing-mastery-course',
        description: 'Complete digital marketing course for Pakistani entrepreneurs.',
        price: 2500,
        comparePrice: 3500,
        images: '/images/products/marketing-course.jpg',
        categoryId: productCategories[0].id,
        status: 'ACTIVE',
        rating: 4.8,
        reviewCount: 45,
        sales: 128
      },
      {
        name: 'Business Startup Kit',
        slug: 'business-startup-kit',
        description: 'Essential tools and templates for starting your business.',
        price: 1500,
        comparePrice: 2000,
        images: '/images/products/business-kit.jpg',
        categoryId: productCategories[1].id,
        status: 'ACTIVE',
        rating: 4.6,
        reviewCount: 32,
        sales: 89
      },
      {
        name: 'Social Media Templates Pack',
        slug: 'social-media-templates-pack',
        description: 'Professional social media templates for your business.',
        price: 800,
        comparePrice: 1200,
        images: '/images/products/social-templates.jpg',
        categoryId: productCategories[2].id,
        status: 'ACTIVE',
        rating: 4.7,
        reviewCount: 67,
        sales: 156
      }
    ]

    for (const product of products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: product
      })
    }

    // Create sample tasks
    const tasks = [
      {
        title: 'Read Business Article',
        description: 'Read and engage with a business development article',
        type: 'CONTENT_ENGAGEMENT',
        category: 'content',
        difficulty: 'EASY',
        reward: 50,
        target: 1,
        timeLimit: 60,
        instructions: 'Read the article completely and spend at least 45 seconds on the page.',
        icon: '📖',
        color: '#3B82F6',
        status: 'ACTIVE',
        articleUrl: 'https://blog.hubspot.com/marketing/content-marketing-plan',
        minDuration: 45,
        requireScrolling: true,
        minScrollPercentage: 70,
        maxAttempts: 3
      },
      {
        title: 'Share Referral Code',
        description: 'Share your referral code with 3 people',
        type: 'REFERRAL',
        category: 'social',
        difficulty: 'MEDIUM',
        reward: 100,
        target: 3,
        instructions: 'Share your unique referral code with friends and family.',
        icon: '👥',
        color: '#10B981',
        status: 'ACTIVE'
      },
      {
        title: 'Complete Profile',
        description: 'Complete your user profile with all required information',
        type: 'PROFILE',
        category: 'account',
        difficulty: 'EASY',
        reward: 25,
        target: 1,
        instructions: 'Fill out all profile fields including name, phone, and bio.',
        icon: '👤',
        color: '#F59E0B',
        status: 'ACTIVE'
      }
    ]

    for (const task of tasks) {
      const existingTask = await prisma.task.findFirst({
        where: { title: task.title }
      })
      
      if (!existingTask) {
        await prisma.task.create({
          data: task
        })
      }
    }

    // Create commission settings
    const commissionLevels = [
      { level: 1, rate: 0.20, description: 'Direct referral commission' },
      { level: 2, rate: 0.15, description: 'Second level commission' },
      { level: 3, rate: 0.10, description: 'Third level commission' },
      { level: 4, rate: 0.08, description: 'Fourth level commission' },
      { level: 5, rate: 0.07, description: 'Fifth level commission' }
    ]

    for (const commission of commissionLevels) {
      await prisma.commissionSettings.upsert({
        where: { level: commission.level },
        update: {},
        create: {
          ...commission,
          isActive: true,
          updatedBy: demoUser.id
        }
      })
    }

    console.log('✅ Sample data seeded successfully!')
    console.log('📊 Created:')
    console.log('  - 3 Blog categories')
    console.log('  - 3 Blog posts')
    console.log('  - 3 Product categories')
    console.log('  - 3 Products')
    console.log('  - 3 Tasks')
    console.log('  - 5 Commission levels')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSampleData()
