import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSocialData() {
  console.log('🌱 Seeding social data...')

  try {
    // Get existing users
    const users = await prisma.user.findMany({
      take: 5,
      where: { isActive: true }
    })

    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.')
      return
    }

    console.log(`✅ Found ${users.length} users`)

    // Create sample posts
    const posts = []
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      
      // Create achievement post
      const post1 = await prisma.socialPost.create({
        data: {
          content: `🎉 Just reached a major milestone in my MLM journey! Grateful for this amazing community and support system. #MLMSuccess #Grateful`,
          type: 'achievement',
          status: 'ACTIVE',
          authorId: user.id
        }
      })
      posts.push(post1)
      console.log(`✅ Created achievement post for ${user.name}`)

      // Create tip post
      if (i < 3) {
        const post2 = await prisma.socialPost.create({
          data: {
            content: `💡 Pro Tip: Always follow up with your team members daily. Consistency is key to building a successful network!`,
            type: 'tip',
            status: 'ACTIVE',
            authorId: user.id
          }
        })
        posts.push(post2)
        console.log(`✅ Created tip post for ${user.name}`)
      }

      // Create general post
      if (i < 2) {
        const post3 = await prisma.socialPost.create({
          data: {
            content: `Just had an amazing team meeting! 🚀 Our network is growing stronger every day. Who's ready to reach new heights together?`,
            type: 'general',
            status: 'ACTIVE',
            authorId: user.id
          }
        })
        posts.push(post3)
        console.log(`✅ Created general post for ${user.name}`)
      }
    }

    console.log(`\n✅ Created ${posts.length} posts`)

    // Add some likes
    let likesCount = 0
    for (const post of posts) {
      // Random number of likes (1-3)
      const numLikes = Math.floor(Math.random() * 3) + 1
      
      for (let i = 0; i < Math.min(numLikes, users.length); i++) {
        const liker = users[i]
        if (liker.id !== post.authorId) {
          try {
            await prisma.socialLike.create({
              data: {
                postId: post.id,
                userId: liker.id
              }
            })
            likesCount++
          } catch (e) {
            // Skip if already liked
          }
        }
      }
    }
    console.log(`✅ Created ${likesCount} likes`)

    // Add some comments
    let commentsCount = 0
    for (const post of posts.slice(0, 5)) {
      const numComments = Math.floor(Math.random() * 2) + 1
      
      for (let i = 0; i < Math.min(numComments, users.length); i++) {
        const commenter = users[i]
        await prisma.socialComment.create({
          data: {
            content: `Great post! Keep up the amazing work! 👏`,
            postId: post.id,
            userId: commenter.id
          }
        })
        commentsCount++
      }
    }
    console.log(`✅ Created ${commentsCount} comments`)

    console.log('\n🎉 Social data seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding social data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedSocialData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
