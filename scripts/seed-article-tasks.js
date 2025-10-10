const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedArticleTasks() {
  console.log('🌱 Seeding article tasks...')

  try {
    // Create article tasks with different tracking requirements
    const articleTasks = [
      {
        title: 'Read: Digital Marketing Basics',
        description: 'Learn the fundamentals of digital marketing by reading this comprehensive article.',
        type: 'ARTICLE',
        category: 'EDUCATION',
        difficulty: 'EASY',
        reward: 50.0,
        target: 1,
        timeLimit: 300, // 5 minutes
        instructions: 'Read the entire article carefully. You must scroll through at least 70% of the content and spend minimum 60 seconds reading.',
        icon: 'BookOpen',
        color: '#3B82F6',
        articleUrl: 'https://blog.hubspot.com/marketing/what-is-digital-marketing',
        minDuration: 60,
        requireScrolling: true,
        requireMouseMovement: true,
        minScrollPercentage: 70,
        maxAttempts: 3
      },
      {
        title: 'Read: E-commerce Trends 2024',
        description: 'Stay updated with the latest e-commerce trends and insights for 2024.',
        type: 'ARTICLE',
        category: 'BUSINESS',
        difficulty: 'MEDIUM',
        reward: 75.0,
        target: 1,
        timeLimit: 420, // 7 minutes
        instructions: 'Read about the latest e-commerce trends. Scroll through the entire article and spend at least 90 seconds reading.',
        icon: 'TrendingUp',
        color: '#10B981',
        articleUrl: 'https://www.shopify.com/blog/ecommerce-trends',
        minDuration: 90,
        requireScrolling: true,
        requireMouseMovement: true,
        minScrollPercentage: 80,
        maxAttempts: 2
      },
      {
        title: 'Read: Social Media Marketing Guide',
        description: 'Comprehensive guide to social media marketing strategies and best practices.',
        type: 'ARTICLE',
        category: 'MARKETING',
        difficulty: 'MEDIUM',
        reward: 60.0,
        target: 1,
        timeLimit: 360, // 6 minutes
        instructions: 'Read the social media marketing guide thoroughly. Make sure to scroll through all sections.',
        icon: 'Share2',
        color: '#8B5CF6',
        articleUrl: 'https://blog.hootsuite.com/social-media-marketing/',
        minDuration: 75,
        requireScrolling: true,
        requireMouseMovement: false,
        minScrollPercentage: 60,
        maxAttempts: 3
      },
      {
        title: 'Read: Affiliate Marketing Success',
        description: 'Learn how to succeed in affiliate marketing with proven strategies and tips.',
        type: 'ARTICLE',
        category: 'AFFILIATE',
        difficulty: 'HARD',
        reward: 100.0,
        target: 1,
        timeLimit: 600, // 10 minutes
        instructions: 'Read this detailed affiliate marketing guide. Spend at least 2 minutes reading and scroll through the entire content.',
        icon: 'Users',
        color: '#F59E0B',
        articleUrl: 'https://neilpatel.com/blog/affiliate-marketing/',
        minDuration: 120,
        requireScrolling: true,
        requireMouseMovement: true,
        minScrollPercentage: 85,
        maxAttempts: 2
      },
      {
        title: 'Read: Content Marketing Strategies',
        description: 'Discover effective content marketing strategies to grow your business.',
        type: 'ARTICLE',
        category: 'CONTENT',
        difficulty: 'MEDIUM',
        reward: 65.0,
        target: 1,
        timeLimit: 480, // 8 minutes
        instructions: 'Read about content marketing strategies. Ensure you scroll through at least 75% of the article.',
        icon: 'FileText',
        color: '#EF4444',
        articleUrl: 'https://contentmarketinginstitute.com/articles/content-marketing-strategy-guide/',
        minDuration: 80,
        requireScrolling: true,
        requireMouseMovement: true,
        minScrollPercentage: 75,
        maxAttempts: 3
      }
    ]

    // Insert tasks
    for (const taskData of articleTasks) {
      const existingTask = await prisma.task.findFirst({
        where: { title: taskData.title }
      })

      if (!existingTask) {
        await prisma.task.create({
          data: taskData
        })
        console.log(`✅ Created task: ${taskData.title}`)
      } else {
        // Update existing task with new article fields
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            articleUrl: taskData.articleUrl,
            minDuration: taskData.minDuration,
            requireScrolling: taskData.requireScrolling,
            requireMouseMovement: taskData.requireMouseMovement,
            minScrollPercentage: taskData.minScrollPercentage,
            maxAttempts: taskData.maxAttempts
          }
        })
        console.log(`🔄 Updated task: ${taskData.title}`)
      }
    }

    console.log('✅ Article tasks seeded successfully!')
    
    // Show summary
    const totalTasks = await prisma.task.count()
    const articleTasksCount = await prisma.task.count({
      where: { type: 'ARTICLE' }
    })
    
    console.log(`📊 Total tasks: ${totalTasks}`)
    console.log(`📖 Article tasks: ${articleTasksCount}`)

  } catch (error) {
    console.error('❌ Error seeding article tasks:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedArticleTasks()
    .then(() => {
      console.log('🎉 Seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedArticleTasks }
