import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function seedDemoTasks() {
  console.log('🎯 Seeding demo tasks for both admin and users...\n');

  // Demo admin tasks
  const adminTasks = [
    {
      title: 'Complete Platform Tutorial',
      description: 'Watch the MLM-Pak platform tutorial video and complete the quiz.',
      type: 'VIDEO_WATCH',
      reward: 50,
      difficulty: 'EASY',
      estimatedDuration: 15,
      instructions: 'Watch the 10-minute tutorial video and answer 3 questions correctly.',
      requirements: JSON.stringify({
        videoUrl: 'https://example.com/tutorial',
        questions: [
          'What is the primary benefit of MLM-Pak?',
          'How do you earn points?',
          'What is the minimum withdrawal amount?'
        ],
        correctAnswers: [0, 1, 2] // All options are correct for demo
      }),
      status: 'ACTIVE',
      isFeatured: true,
      category: 'EDUCATION',
      dailyLimit: 1,
      totalLimit: 1,
      createdBy: 'admin',
    },
    {
      title: 'Refer 3 Friends',
      description: 'Successfully refer 3 new users to the platform.',
      type: 'REFERRAL',
      reward: 200,
      difficulty: 'MEDIUM',
      estimatedDuration: 60,
      instructions: 'Share your referral code and get 3 friends to register and verify their accounts.',
      requirements: JSON.stringify({
        referralCount: 3,
        verificationRequired: true
      }),
      status: 'ACTIVE',
      isFeatured: true,
      category: 'REFERRAL',
      dailyLimit: 1,
      totalLimit: 5,
      createdBy: 'admin',
    },
    {
      title: 'Daily Login Streak',
      description: 'Login to the platform for 7 consecutive days.',
      type: 'DAILY_LOGIN',
      reward: 25,
      difficulty: 'EASY',
      estimatedDuration: 5,
      instructions: 'Simply login to your account daily for 7 days in a row.',
      requirements: JSON.stringify({
        streakDays: 7,
        resetOnMiss: true
      }),
      status: 'ACTIVE',
      isFeatured: false,
      category: 'ENGAGEMENT',
      dailyLimit: 1,
      totalLimit: 1,
      createdBy: 'admin',
    }
  ];

  // Demo content engagement tasks
  const contentTasks = [
    {
      title: 'Read: AI in Digital Marketing 2024',
      description: 'Read our comprehensive article about AI applications in digital marketing and complete the quiz.',
      type: 'CONTENT_ENGAGEMENT',
      reward: 35,
      difficulty: 'MEDIUM',
      estimatedDuration: 20,
      instructions: 'Read the full article, spend at least 2 minutes reading, and answer the quiz correctly.',
      requirements: JSON.stringify({
        contentUrl: 'http://localhost:3002/content/ai-digital-marketing',
        category: 'TECHNOLOGY',
        minReadTime: 120, // 2 minutes
        scrollDepth: 80, // 80% of page
        quizRequired: true,
        quizQuestions: [
          {
            question: "What is the main benefit of AI in marketing?",
            options: ["Cost reduction", "Personalization", "Automation", "All of the above"],
            correct: 3
          }
        ]
      }),
      status: 'ACTIVE',
      isFeatured: true,
      category: 'TECHNOLOGY',
      dailyLimit: 3,
      totalLimit: 10,
      createdBy: 'admin',
    },
    {
      title: 'Read: Remote Work Best Practices',
      description: 'Learn about effective remote work strategies and productivity tips.',
      type: 'CONTENT_ENGAGEMENT',
      reward: 25,
      difficulty: 'EASY',
      estimatedDuration: 15,
      instructions: 'Read the article about remote work and complete the short quiz.',
      requirements: JSON.stringify({
        contentUrl: 'http://localhost:3002/content/remote-work',
        category: 'LIFESTYLE',
        minReadTime: 90,
        scrollDepth: 75,
        quizRequired: true,
        quizQuestions: [
          {
            question: "What is the recommended break schedule for remote work?",
            options: ["5 min every hour", "15 min every 2 hours", "30 min every 3 hours", "No breaks needed"],
            correct: 1
          }
        ]
      }),
      status: 'ACTIVE',
      isFeatured: true,
      category: 'LIFESTYLE',
      dailyLimit: 3,
      totalLimit: 10,
      createdBy: 'admin',
    },
    {
      title: 'Read: Small Business Digital Marketing',
      description: 'Discover digital marketing strategies for small businesses on a budget.',
      type: 'CONTENT_ENGAGEMENT',
      reward: 30,
      difficulty: 'MEDIUM',
      estimatedDuration: 18,
      instructions: 'Read the business article and test your knowledge with our quiz.',
      requirements: JSON.stringify({
        contentUrl: 'http://localhost:3002/content/small-business-marketing',
        category: 'BUSINESS',
        minReadTime: 120,
        scrollDepth: 80,
        quizRequired: true,
        quizQuestions: [
          {
            question: "What is the most cost-effective digital marketing channel for small businesses?",
            options: ["TV advertising", "Social media marketing", "Billboard advertising", "Radio ads"],
            correct: 1
          }
        ]
      }),
      status: 'ACTIVE',
      isFeatured: true,
      category: 'BUSINESS',
      dailyLimit: 3,
      totalLimit: 10,
      createdBy: 'admin',
    }
  ];

  // Demo social media tasks
  const socialTasks = [
    {
      title: 'Follow on Instagram',
      description: 'Follow our official Instagram account @mlmpakofficial',
      type: 'SOCIAL_MEDIA',
      reward: 15,
      difficulty: 'EASY',
      estimatedDuration: 5,
      instructions: 'Follow our Instagram account and provide your username for verification.',
      requirements: JSON.stringify({
        platform: 'instagram',
        action: 'follow',
        account: '@mlmpakofficial',
        verificationMethod: 'username_check'
      }),
      status: 'ACTIVE',
      isFeatured: false,
      category: 'SOCIAL_MEDIA',
      dailyLimit: 1,
      totalLimit: 1,
      createdBy: 'admin',
    },
    {
      title: 'Share on Facebook',
      description: 'Share our latest post on your Facebook timeline',
      type: 'SOCIAL_MEDIA',
      reward: 20,
      difficulty: 'EASY',
      estimatedDuration: 5,
      instructions: 'Share our Facebook post and provide the share URL for verification.',
      requirements: JSON.stringify({
        platform: 'facebook',
        action: 'share',
        verificationMethod: 'url_check'
      }),
      status: 'ACTIVE',
      isFeatured: false,
      category: 'SOCIAL_MEDIA',
      dailyLimit: 1,
      totalLimit: 3,
      createdBy: 'admin',
    }
  ];

  try {
    // Clear existing demo tasks
    console.log('🧹 Clearing existing demo tasks...');
    await prisma.task.deleteMany({});

    // Insert admin demo tasks
    console.log('📋 Creating admin demo tasks...');
    for (const task of [...adminTasks, ...contentTasks, ...socialTasks]) {
      const createdTask = await prisma.task.create({
        data: {
          id: crypto.randomUUID(),
          ...task,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      console.log(`✅ Created: ${createdTask.title} (${createdTask.type}) - ${createdTask.reward} points`);
    }

    // Create demo user-specific tasks
    console.log('\n👤 Creating user demo tasks...');
    
    const userTasks = [
      {
        title: 'Complete Profile Setup',
        description: 'Complete your profile with profile picture and bio',
        type: 'PROFILE_COMPLETION',
        reward: 100,
        difficulty: 'EASY',
        estimatedDuration: 10,
        instructions: 'Upload a profile picture and write a short bio about yourself',
        requirements: JSON.stringify({
          profilePicture: true,
          bioLength: 50,
          verificationRequired: true
        }),
        status: 'ACTIVE',
        isFeatured: true,
        category: 'PROFILE',
        dailyLimit: 1,
        totalLimit: 1,
        createdBy: 'user_demo',
      },
      {
        title: 'First Withdrawal Tutorial',
        description: 'Complete your first withdrawal process tutorial',
        type: 'TUTORIAL',
        reward: 75,
        difficulty: 'EASY',
        estimatedDuration: 8,
        instructions: 'Go through the withdrawal process tutorial and complete the quiz',
        requirements: JSON.stringify({
          tutorialType: 'withdrawal',
          quizRequired: true
        }),
        status: 'ACTIVE',
        isFeatured: true,
        category: 'EDUCATION',
        dailyLimit: 1,
        totalLimit: 1,
        createdBy: 'user_demo',
      }
    ];

    for (const task of userTasks) {
      const createdTask = await prisma.task.create({
        data: {
          id: crypto.randomUUID(),
          ...task,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      console.log(`✅ Created: ${createdTask.title} (${createdTask.type}) - ${createdTask.reward} points`);
    }

    console.log('\n🎉 Demo tasks seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Admin tasks: 8 created');
    console.log('   - User demo tasks: 2 created');
    console.log('   - Total: 10 demo tasks ready for testing');

  } catch (error) {
    console.error('❌ Error seeding demo tasks:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDemoTasks()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
