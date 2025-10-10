import { PrismaClient } from '@prisma/client'
import { contentTasks } from '@/lib/content-tasks'

const prisma = new PrismaClient()

async function seedContentTasks() {
  console.log('Seeding content engagement tasks...')

  try {
    // Clear existing content tasks
    await prisma.task.deleteMany({
      where: {
        type: 'CONTENT_ENGAGEMENT'
      }
    })

    // Create new content tasks
    for (const task of contentTasks) {
      await prisma.task.create({
        data: {
          id: task.id,
          title: task.title,
          description: task.description,
          type: 'CONTENT_ENGAGEMENT',
          category: task.contentType,
          difficulty: 'MEDIUM',
          reward: task.reward,
          target: 1,
          timeLimit: task.timeRequirement,
          instructions: `Visit the content site and engage with the article for at least ${task.timeRequirement} minutes. Complete the comprehension quiz to verify genuine engagement.`,
          status: 'ACTIVE',
          icon: 'BookOpen',
          color: 'blue',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    console.log('✅ Content tasks seeded successfully!')
    console.log(`Created ${contentTasks.length} content engagement tasks`)

  } catch (error) {
    console.error('Error seeding content tasks:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
if (require.main === module) {
  seedContentTasks()
}
