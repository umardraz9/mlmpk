const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedBlogContent() {
  console.log('🌱 Seeding blog content...')

  try {
    // Get demo user to be the author
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demouser@example.com' }
    })

    if (!demoUser) {
      console.error('❌ Demo user not found! Please run create-demo-user.js first.')
      return
    }

    console.log(`👤 Using demo user as author: ${demoUser.name} (${demoUser.email})`)

    // Create blog categories
    const categories = [
      {
        name: 'Success Stories',
        slug: 'success-stories',
        description: 'Real success stories from our community members',
        color: '#10B981'
      },
      {
        name: 'Business Tips',
        slug: 'business-tips',
        description: 'Tips and strategies for growing your business',
        color: '#3B82F6'
      },
      {
        name: 'Product Reviews',
        slug: 'product-reviews',
        description: 'Honest reviews of our latest products',
        color: '#8B5CF6'
      },
      {
        name: 'Training Guides',
        slug: 'training-guides',
        description: 'Step-by-step guides for new members',
        color: '#F59E0B'
      },
      {
        name: 'Market Updates',
        slug: 'market-updates',
        description: 'Latest trends and market analysis',
        color: '#EF4444'
      }
    ]

    console.log('\n📂 Creating blog categories...')
    const createdCategories = []

    for (const categoryData of categories) {
      const existingCategory = await prisma.blogCategory.findFirst({
        where: { slug: categoryData.slug }
      })

      if (!existingCategory) {
        const category = await prisma.blogCategory.create({
          data: categoryData
        })
        createdCategories.push(category)
        console.log(`✅ Created category: ${category.name}`)
      } else {
        createdCategories.push(existingCategory)
        console.log(`🔄 Category already exists: ${existingCategory.name}`)
      }
    }

    // Create blog tags
    const tags = [
      { name: 'MLM', slug: 'mlm', color: '#10B981' },
      { name: 'Success', slug: 'success', color: '#3B82F6' },
      { name: 'Tips', slug: 'tips', color: '#8B5CF6' },
      { name: 'Beginner', slug: 'beginner', color: '#F59E0B' },
      { name: 'Advanced', slug: 'advanced', color: '#EF4444' },
      { name: 'Marketing', slug: 'marketing', color: '#06B6D4' },
      { name: 'Sales', slug: 'sales', color: '#84CC16' },
      { name: 'Leadership', slug: 'leadership', color: '#F97316' }
    ]

    console.log('\n🏷️ Creating blog tags...')
    const createdTags = []

    for (const tagData of tags) {
      const existingTag = await prisma.blogTag.findFirst({
        where: { slug: tagData.slug }
      })

      if (!existingTag) {
        const tag = await prisma.blogTag.create({
          data: tagData
        })
        createdTags.push(tag)
        console.log(`✅ Created tag: ${tag.name}`)
      } else {
        createdTags.push(existingTag)
        console.log(`🔄 Tag already exists: ${existingTag.name}`)
      }
    }

    // Create blog posts
    const posts = [
      {
        title: 'How I Earned PKR 50,000 in My First Month with MCNmart',
        slug: 'first-month-success-mcnmart',
        content: `
          <h2>My Journey to Success</h2>
          <p>When I first joined MCNmart, I was skeptical about whether I could really make money online. But within just 30 days, I had earned PKR 50,000! Here's exactly how I did it.</p>
          
          <h3>Week 1: Getting Started</h3>
          <p>I started by completing the daily tasks consistently. Each task earned me between PKR 50-100, and I made sure to complete at least 5 tasks per day. This gave me a solid foundation and helped me understand the platform.</p>
          
          <h3>Week 2: Building My Network</h3>
          <p>I began inviting friends and family to join MCNmart using my referral code. For every person who joined, I earned a PKR 500 bonus. I managed to get 15 people to join in my second week.</p>
          
          <h3>Week 3-4: Scaling Up</h3>
          <p>By the third week, my network was growing exponentially. My referrals were also bringing in their own referrals, and I was earning commissions from multiple levels. The 5-level commission structure really started paying off.</p>
          
          <h3>Key Strategies That Worked</h3>
          <ul>
            <li>Consistency in completing daily tasks</li>
            <li>Active engagement with the community</li>
            <li>Helping my referrals succeed</li>
            <li>Sharing success stories on social media</li>
          </ul>
          
          <p>If you're just starting out, remember that success doesn't happen overnight. But with dedication and the right strategy, you can achieve amazing results with MCNmart!</p>
        `,
        excerpt: 'Discover how I earned PKR 50,000 in my first month with MCNmart using proven strategies and consistent effort.',
        featuredImage: '/images/blog/success-story-1.jpg',
        categoryId: createdCategories[0].id, // Success Stories
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-15'),
        tags: [createdTags[0].id, createdTags[1].id] // MLM, Success
      },
      {
        title: 'Building Your Dream Team: Complete Partnership Guide',
        slug: 'building-dream-team-partnership-guide',
        content: `
          <h2>The Art of Building a Successful Team</h2>
          <p>Building a successful partnership team is the key to long-term success in MCNmart. Here's your complete guide to creating a thriving network.</p>
          
          <h3>Finding the Right People</h3>
          <p>Not everyone is cut out for partnership marketing. Look for people who are:</p>
          <ul>
            <li>Motivated and goal-oriented</li>
            <li>Good communicators</li>
            <li>Willing to learn and adapt</li>
            <li>Positive and enthusiastic</li>
          </ul>
          
          <h3>Training Your Team</h3>
          <p>Once you've recruited team members, proper training is crucial. I recommend:</p>
          <ol>
            <li>Start with the basics - how the platform works</li>
            <li>Show them how to complete tasks effectively</li>
            <li>Teach them recruitment strategies</li>
            <li>Provide ongoing support and motivation</li>
          </ol>
          
          <h3>Maintaining Team Momentum</h3>
          <p>Keep your team motivated with regular check-ins, success celebrations, and continuous learning opportunities. Remember, your success depends on their success!</p>
        `,
        excerpt: 'Learn the proven strategies for building and managing a successful partnership team that generates consistent income.',
        featuredImage: '/images/blog/team-building.jpg',
        categoryId: createdCategories[1].id, // Business Tips
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-20'),
        tags: [createdTags[2].id, createdTags[7].id] // Tips, Leadership
      },
      {
        title: '5 Daily Habits of Successful MCNmart Partners',
        slug: 'daily-habits-successful-partners',
        content: `
          <h2>Habits That Drive Success</h2>
          <p>Success in MCNmart isn't about luck - it's about developing the right daily habits. Here are the 5 habits that separate top performers from the rest.</p>
          
          <h3>1. Start Your Day with Task Completion</h3>
          <p>Successful partners complete their daily tasks first thing in the morning. This ensures consistent income and builds momentum for the day.</p>
          
          <h3>2. Engage with Your Network Daily</h3>
          <p>Spend at least 30 minutes each day connecting with your team members. Answer questions, provide support, and celebrate their wins.</p>
          
          <h3>3. Learn Something New</h3>
          <p>The most successful partners are always learning. Whether it's a new marketing technique or platform feature, continuous learning is key.</p>
          
          <h3>4. Track Your Progress</h3>
          <p>Keep detailed records of your earnings, team growth, and task completion rates. This helps you identify what's working and what needs improvement.</p>
          
          <h3>5. Plan Tomorrow Today</h3>
          <p>End each day by planning your tasks and goals for tomorrow. This ensures you start each day with clear direction and purpose.</p>
        `,
        excerpt: 'Discover the daily habits that separate top-performing MCNmart partners from the rest of the pack.',
        featuredImage: '/images/blog/daily-habits.jpg',
        categoryId: createdCategories[1].id, // Business Tips
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-25'),
        tags: [createdTags[2].id, createdTags[4].id] // Tips, Advanced
      },
      {
        title: 'MCNmart Product Review: Digital Marketing Course',
        slug: 'product-review-digital-marketing-course',
        content: `
          <h2>Comprehensive Review: Digital Marketing Mastery Course</h2>
          <p>I recently completed the Digital Marketing Mastery Course available in the MCNmart store. Here's my honest review.</p>
          
          <h3>What's Included</h3>
          <ul>
            <li>12 comprehensive video modules</li>
            <li>Downloadable resources and templates</li>
            <li>Live Q&A sessions with experts</li>
            <li>Certificate of completion</li>
            <li>Lifetime access to updates</li>
          </ul>
          
          <h3>The Good</h3>
          <p>The course content is well-structured and covers everything from social media marketing to email campaigns. The instructors are knowledgeable and explain complex concepts in simple terms.</p>
          
          <h3>The Not-So-Good</h3>
          <p>Some modules could be more interactive. While the content is excellent, more hands-on exercises would enhance the learning experience.</p>
          
          <h3>Value for Money</h3>
          <p>At PKR 2,500, this course offers excellent value. Similar courses elsewhere cost much more and don't include the ongoing support.</p>
          
          <h3>Final Verdict</h3>
          <p>I highly recommend this course for anyone serious about improving their digital marketing skills. It's helped me increase my MCNmart earnings by 40%!</p>
          
          <p><strong>Rating: 4.5/5 stars</strong></p>
        `,
        excerpt: 'An honest review of the Digital Marketing Mastery Course - is it worth your investment?',
        featuredImage: '/images/blog/course-review.jpg',
        categoryId: createdCategories[2].id, // Product Reviews
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-30'),
        tags: [createdTags[5].id, createdTags[2].id] // Marketing, Tips
      },
      {
        title: 'Beginner\'s Guide: Your First 30 Days on MCNmart',
        slug: 'beginners-guide-first-30-days',
        content: `
          <h2>Welcome to MCNmart!</h2>
          <p>Starting your journey with MCNmart can be overwhelming. This guide will help you make the most of your first 30 days.</p>
          
          <h3>Days 1-7: Foundation Building</h3>
          <p>Focus on understanding the platform and completing your first tasks. Aim to:</p>
          <ul>
            <li>Complete your profile setup</li>
            <li>Finish at least 3 tasks daily</li>
            <li>Join the community forums</li>
            <li>Watch the welcome video series</li>
          </ul>
          
          <h3>Days 8-15: Network Building</h3>
          <p>Start building your network by inviting friends and family. Remember:</p>
          <ul>
            <li>Quality over quantity</li>
            <li>Provide value, don't just sell</li>
            <li>Be patient and supportive</li>
          </ul>
          
          <h3>Days 16-30: Optimization</h3>
          <p>Analyze your progress and optimize your strategy. Focus on what's working and improve what isn't.</p>
          
          <h3>Pro Tips for Success</h3>
          <ol>
            <li>Set realistic daily goals</li>
            <li>Track your progress</li>
            <li>Learn from successful partners</li>
            <li>Stay consistent</li>
            <li>Don't give up!</li>
          </ol>
        `,
        excerpt: 'A step-by-step guide to maximize your success in your first 30 days on MCNmart.',
        featuredImage: '/images/blog/beginners-guide.jpg',
        categoryId: createdCategories[3].id, // Training Guides
        status: 'PUBLISHED',
        publishedAt: new Date('2024-02-01'),
        tags: [createdTags[3].id, createdTags[2].id] // Beginner, Tips
      }
    ]

    console.log('\n📝 Creating blog posts...')

    for (const postData of posts) {
      const existingPost = await prisma.blogPost.findFirst({
        where: { slug: postData.slug }
      })

      if (!existingPost) {
        const post = await prisma.blogPost.create({
          data: {
            ...postData,
            authorId: demoUser.id,
            tags: {
              connect: postData.tags.map(tagId => ({ id: tagId }))
            }
          }
        })
        console.log(`✅ Created post: ${post.title}`)
      } else {
        console.log(`🔄 Post already exists: ${existingPost.title}`)
      }
    }

    console.log('\n✅ Blog content seeded successfully!')
    
    // Show summary
    const totalCategories = await prisma.blogCategory.count()
    const totalTags = await prisma.blogTag.count()
    const totalPosts = await prisma.blogPost.count()
    
    console.log(`\n📊 Summary:`)
    console.log(`   📂 Categories: ${totalCategories}`)
    console.log(`   🏷️ Tags: ${totalTags}`)
    console.log(`   📝 Posts: ${totalPosts}`)

  } catch (error) {
    console.error('❌ Error seeding blog content:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
if (require.main === module) {
  seedBlogContent()
    .then(() => {
      console.log('\n🎉 Blog seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Blog seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedBlogContent }
