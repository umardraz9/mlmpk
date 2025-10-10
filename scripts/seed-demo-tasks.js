const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDemoTasks() {
  console.log('🎯 Seeding demo tasks...\n');

  try {
    // Clear existing tasks
    await prisma.task.deleteMany({});
    console.log('🧹 Cleared existing tasks');

    // Demo tasks for admin and users
    const demoTasks = [
      {
        title: 'Complete Platform Tutorial',
        description: 'Watch the MLM-Pak platform tutorial video and complete the quiz',
        type: 'VIDEO_WATCH',
        category: 'EDUCATION',
        reward: 50,
        instructions: 'Watch the tutorial and answer 3 questions correctly',
        target: 1,
        difficulty: 'EASY',
        status: 'ACTIVE',
      },
      {
        title: 'AI in Digital Marketing Article',
        description: 'Read our comprehensive article about AI in digital marketing',
        type: 'CONTENT_ENGAGEMENT',
        category: 'TECHNOLOGY',
        reward: 35,
        instructions: 'Read the article and complete the quiz',
        target: 1,
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
      },
      {
        title: 'Remote Work Best Practices',
        description: 'Learn about effective remote work strategies',
        type: 'CONTENT_ENGAGEMENT',
        category: 'LIFESTYLE',
        reward: 25,
        instructions: 'Read the article and complete the short quiz',
        target: 1,
        difficulty: 'EASY',
        status: 'ACTIVE',
      },
      {
        title: 'Refer 3 Friends',
        description: 'Successfully refer 3 new users to the platform',
        type: 'REFERRAL',
        category: 'REFERRAL',
        reward: 200,
        instructions: 'Share your referral code and get 3 friends to register',
        target: 3,
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
      },
      {
        title: 'Daily Login Streak',
        description: 'Login for 7 consecutive days',
        type: 'DAILY_LOGIN',
        category: 'ENGAGEMENT',
        reward: 25,
        instructions: 'Login daily for 7 days in a row',
        target: 7,
        difficulty: 'EASY',
        status: 'ACTIVE',
      },
      {
        title: 'Follow on Instagram',
        description: 'Follow our official Instagram account',
        type: 'SOCIAL_MEDIA',
        category: 'SOCIAL_MEDIA',
        reward: 15,
        instructions: 'Follow @mlmpakofficial and provide your username',
        target: 1,
        difficulty: 'EASY',
        status: 'ACTIVE',
      },
      {
        title: 'Complete Profile Setup',
        description: 'Complete your profile with picture and bio',
        type: 'PROFILE_COMPLETION',
        category: 'PROFILE',
        reward: 100,
        instructions: 'Upload profile picture and write a short bio',
        target: 1,
        difficulty: 'EASY',
        status: 'ACTIVE',
      },
      {
        title: 'Small Business Marketing Article',
        description: 'Read about digital marketing for small businesses',
        type: 'CONTENT_ENGAGEMENT',
        category: 'BUSINESS',
        reward: 30,
        instructions: 'Read the business article and complete the quiz',
        target: 1,
        difficulty: 'MEDIUM',
        status: 'ACTIVE',
      }
    ];

    // Create tasks
    let createdCount = 0;
    for (const taskData of demoTasks) {
      const createdTask = await prisma.task.create({
        data: {
          ...taskData,
          id: require('crypto').randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      createdCount++;
      console.log(`✅ Created: ${createdTask.title} (${createdTask.type}) - ${createdTask.reward} points`);
    }

    console.log(`\n🎉 Successfully created ${createdCount} demo tasks!`);
    console.log('\n📊 Task Summary:');
    console.log('   - Content Engagement: 3 tasks');
    console.log('   - Video Watch: 1 task');
    console.log('   - Referral: 1 task');
    console.log('   - Daily Login: 1 task');
    console.log('   - Social Media: 1 task');
    console.log('   - Profile Completion: 1 task');

  } catch (error) {
    console.error('❌ Error seeding demo tasks:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDemoTasks()
  .catch(console.error)
  .finally(() => process.exit(0));
