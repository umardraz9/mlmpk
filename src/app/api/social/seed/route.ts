import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'

// POST - Seed sample social data
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create sample posts
    const samplePosts = [
      {
        content: 'Just achieved my monthly sales target! 🎉 The MCNmart platform has been incredible for growing my business. Special thanks to my amazing team! #MCNmart #Success #TeamWork',
        type: 'achievement',
        authorId: session.user.id
      },
      {
        content: 'New product review video is live! Check out the amazing quality of our latest electronics collection. The customer feedback has been incredible! 📱💻',
        type: 'general',
        authorId: session.user.id
      },
      {
        content: 'Top 5 tips for new MLM members:\n1. Build genuine relationships\n2. Share your story authentically\n3. Focus on helping others\n4. Stay consistent\n5. Learn continuously\n\nWhat would you add to this list? 💭',
        type: 'tip',
        authorId: session.user.id
      },
      {
        content: 'Exciting news! 🚀 We\'re launching new training modules next week. Get ready to level up your skills and boost your earnings. Stay tuned for more details!',
        type: 'announcement',
        authorId: session.user.id
      },
      {
        content: 'Grateful for this amazing community! 🙏 The support and encouragement from fellow members has been overwhelming. Together we grow stronger! 💪',
        type: 'general',
        authorId: session.user.id
      }
    ]

    // Create posts in database
    const createdPosts = []
    for (const postData of samplePosts) {
      const post = await prisma.socialPost.create({
        data: postData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              totalPoints: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true
            }
          }
        }
      })
      createdPosts.push(post)
    }

    // Create sample achievements
    const sampleAchievements = [
      {
        userId: session.user.id,
        title: 'First Post',
        description: 'Created your first social media post',
        icon: '🎉',
        type: 'social',
        points: 10,
        isPublic: true
      },
      {
        userId: session.user.id,
        title: 'Community Builder',
        description: 'Engaged with 5 different posts',
        icon: '🤝',
        type: 'engagement',
        points: 25,
        isPublic: true
      },
      {
        userId: session.user.id,
        title: 'Top Performer',
        description: 'Achieved highest sales this month',
        icon: '🏆',
        type: 'sales',
        points: 100,
        isPublic: true
      }
    ]

    // Create achievements
    const createdAchievements = []
    for (const achievementData of sampleAchievements) {
      const achievement = await prisma.userAchievement.create({
        data: achievementData
      })
      createdAchievements.push(achievement)
    }

    // Add some sample likes to posts
    for (const post of createdPosts.slice(0, 3)) {
      await prisma.socialLike.create({
        data: {
          postId: post.id,
          userId: session.user.id
        }
      })
    }

    // Add some sample comments
    const sampleComments = [
      'Congratulations! Well deserved! 🎉',
      'This is so inspiring! Keep up the great work!',
      'Thanks for sharing these valuable tips!',
      'Looking forward to the new training modules!',
      'Absolutely agree! This community is amazing!'
    ]

    for (let i = 0; i < createdPosts.length; i++) {
      await prisma.socialComment.create({
        data: {
          postId: createdPosts[i].id,
          userId: session.user.id,
          content: sampleComments[i]
        }
      })
    }

    // Update user points
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalPoints: {
          increment: 200 // Bonus points for seeding data
        }
      }
    })

    return NextResponse.json({
      message: 'Sample data created successfully',
      posts: createdPosts.length,
      achievements: createdAchievements.length,
      comments: sampleComments.length,
      likes: 3
    })
  } catch (error) {
    console.error('Error seeding social data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
