const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBlogPosts() {
  try {
    console.log('🌱 Seeding blog posts...');

    // Get or create admin user
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@mcnmart.com' }
    });

    if (!admin) {
      console.log('❌ Admin user not found. Please run create-admin-user.js first.');
      return;
    }

    // Get or create Business category
    let businessCategory = await prisma.blogCategory.findFirst({
      where: { slug: 'business' }
    });

    if (!businessCategory) {
      businessCategory = await prisma.blogCategory.create({
        data: {
          name: 'Business',
          slug: 'business',
          description: 'Business tips and strategies',
          color: 'bg-blue-500'
        }
      });
      console.log('✅ Created Business category');
    }

    // Get or create Technology category
    let technologyCategory = await prisma.blogCategory.findFirst({
      where: { slug: 'technology' }
    });

    if (!technologyCategory) {
      technologyCategory = await prisma.blogCategory.create({
        data: {
          name: 'Technology',
          slug: 'technology',
          description: 'Technology trends and updates',
          color: 'bg-purple-500'
        }
      });
      console.log('✅ Created Technology category');
    }

    // Blog posts data
    const blogPosts = [
      {
        title: '15 TESTED Ways to Earn Money in Pakistan',
        slug: '15-tested-ways-to-earn-money-in-pakistan',
        excerpt: 'I remember reading about people who have already done what I wanted to do. Reading about it gave me the confidence that "if...',
        content: `
          <h2>Introduction</h2>
          <p>I remember reading about people who have already done what I wanted to do. Reading about it gave me the confidence that "if they can do it, so can I." This comprehensive guide will walk you through 15 tested and proven ways to earn money in Pakistan.</p>
          
          <h2>1. Freelancing</h2>
          <p>Freelancing is one of the most popular ways to earn money online in Pakistan. Platforms like Upwork, Fiverr, and Freelancer connect Pakistani professionals with clients worldwide.</p>
          
          <h2>2. E-commerce</h2>
          <p>Starting an online store has never been easier. You can sell products through platforms like Daraz, or create your own website.</p>
          
          <h2>3. Content Creation</h2>
          <p>YouTube, blogging, and social media content creation can generate substantial income through ads, sponsorships, and affiliate marketing.</p>
          
          <h2>4. Online Teaching</h2>
          <p>Share your knowledge by teaching online. Platforms like Udemy and Coursera allow you to create and sell courses.</p>
          
          <h2>5. Graphic Design</h2>
          <p>If you have design skills, you can offer services on Fiverr, 99designs, or directly to clients.</p>
          
          <h2>6. Web Development</h2>
          <p>Web developers are in high demand. Learn HTML, CSS, JavaScript, and frameworks like React to start earning.</p>
          
          <h2>7. Mobile App Development</h2>
          <p>Create mobile apps for Android and iOS. The demand for app developers continues to grow.</p>
          
          <h2>8. Digital Marketing</h2>
          <p>Help businesses grow their online presence through SEO, social media marketing, and paid advertising.</p>
          
          <h2>9. Virtual Assistant</h2>
          <p>Provide administrative support to businesses remotely. Tasks include email management, scheduling, and customer service.</p>
          
          <h2>10. Translation Services</h2>
          <p>If you're fluent in multiple languages, offer translation services to clients worldwide.</p>
          
          <h2>11. Data Entry</h2>
          <p>While not the highest paying, data entry jobs are easy to start and require minimal skills.</p>
          
          <h2>12. Stock Photography</h2>
          <p>Sell your photos on stock photography websites like Shutterstock and Adobe Stock.</p>
          
          <h2>13. Affiliate Marketing</h2>
          <p>Promote products and earn commissions on sales. Join programs like Amazon Associates or local Pakistani affiliate networks.</p>
          
          <h2>14. Online Surveys</h2>
          <p>Participate in paid surveys and market research studies. While income is modest, it's easy to start.</p>
          
          <h2>15. MLM and Network Marketing</h2>
          <p>Join legitimate MLM companies like MCNmart to build a business through product sales and team building.</p>
          
          <h2>Conclusion</h2>
          <p>These 15 methods have been tested and proven to work in Pakistan. Choose the ones that match your skills and interests, and start your journey to financial independence today!</p>
        `,
        featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        categoryId: businessCategory.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-09-24'),
        views: 82,
        isCommentingEnabled: true
      },
      {
        title: 'Starting Your Online Business in Pakistan',
        slug: 'starting-online-business-pakistan',
        excerpt: 'Learn how to start your online business in Pakistan with this comprehensive guide...',
        content: `
          <h2>Why Start an Online Business?</h2>
          <p>The digital economy in Pakistan is booming. With increasing internet penetration and mobile usage, there's never been a better time to start an online business.</p>
          
          <h2>Step 1: Choose Your Niche</h2>
          <p>Identify a profitable niche that matches your interests and expertise. Research market demand and competition.</p>
          
          <h2>Step 2: Create a Business Plan</h2>
          <p>Outline your business goals, target audience, revenue model, and marketing strategy.</p>
          
          <h2>Step 3: Register Your Business</h2>
          <p>Register with SECP (Securities and Exchange Commission of Pakistan) to make your business legal.</p>
          
          <h2>Step 4: Build Your Online Presence</h2>
          <p>Create a professional website and establish social media profiles on platforms popular in Pakistan.</p>
          
          <h2>Step 5: Set Up Payment Methods</h2>
          <p>Integrate local payment gateways like JazzCash, Easypaisa, and bank transfers.</p>
          
          <h2>Step 6: Market Your Business</h2>
          <p>Use digital marketing strategies including SEO, social media marketing, and content marketing to attract customers.</p>
          
          <h2>Step 7: Provide Excellent Customer Service</h2>
          <p>Build trust and loyalty by providing exceptional customer service and support.</p>
          
          <h2>Conclusion</h2>
          <p>Starting an online business in Pakistan requires planning, dedication, and continuous learning. Follow these steps to build a successful online venture.</p>
        `,
        featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        categoryId: businessCategory.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-09-19'),
        views: 245,
        isCommentingEnabled: true
      },
      {
        title: 'Digital Marketing Strategies for Pakistani Businesses',
        slug: 'digital-marketing-strategies-pakistan',
        excerpt: 'Discover effective digital marketing strategies tailored for the Pakistani market...',
        content: `
          <h2>Understanding the Pakistani Digital Landscape</h2>
          <p>Pakistan's digital landscape is unique, with high social media usage and mobile-first internet access. Understanding these characteristics is key to successful digital marketing.</p>
          
          <h2>1. Social Media Marketing</h2>
          <p>Facebook, Instagram, and TikTok are the most popular platforms in Pakistan. Create engaging content that resonates with local audiences.</p>
          
          <h2>2. Search Engine Optimization (SEO)</h2>
          <p>Optimize your website for search engines to increase organic traffic. Focus on local keywords and Urdu content when appropriate.</p>
          
          <h2>3. Content Marketing</h2>
          <p>Create valuable content that educates and entertains your audience. Blog posts, videos, and infographics work well.</p>
          
          <h2>4. Email Marketing</h2>
          <p>Build an email list and send targeted campaigns. Email marketing has excellent ROI when done correctly.</p>
          
          <h2>5. Influencer Marketing</h2>
          <p>Partner with Pakistani influencers to reach wider audiences and build credibility.</p>
          
          <h2>6. Paid Advertising</h2>
          <p>Use Facebook Ads and Google Ads to reach specific demographics. Start with small budgets and scale what works.</p>
          
          <h2>7. WhatsApp Marketing</h2>
          <p>WhatsApp is extremely popular in Pakistan. Use WhatsApp Business to communicate with customers.</p>
          
          <h2>8. Video Marketing</h2>
          <p>Create engaging video content for YouTube and social media. Video content has higher engagement rates.</p>
          
          <h2>Conclusion</h2>
          <p>Digital marketing in Pakistan requires understanding local preferences and behaviors. Implement these strategies to grow your business online.</p>
        `,
        featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        categoryId: businessCategory.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-09-15'),
        views: 156,
        isCommentingEnabled: true
      },
      {
        title: 'Technology Trends in Pakistan 2024',
        slug: 'technology-trends-pakistan-2024',
        excerpt: 'Explore the latest technology trends shaping Pakistan\'s digital future in 2024...',
        content: `
          <h2>Introduction</h2>
          <p>Pakistan's technology sector is experiencing rapid growth. Here are the key trends shaping 2024.</p>
          
          <h2>1. Artificial Intelligence and Machine Learning</h2>
          <p>AI and ML are being adopted across industries in Pakistan, from healthcare to finance.</p>
          
          <h2>2. 5G Technology</h2>
          <p>The rollout of 5G networks is expected to revolutionize mobile connectivity and enable new applications.</p>
          
          <h2>3. E-commerce Growth</h2>
          <p>Online shopping continues to grow, with more businesses moving online and new platforms emerging.</p>
          
          <h2>4. Fintech Innovation</h2>
          <p>Digital payment solutions and mobile banking are transforming Pakistan's financial landscape.</p>
          
          <h2>5. Cloud Computing</h2>
          <p>More businesses are moving to cloud infrastructure for scalability and cost-effectiveness.</p>
          
          <h2>6. Cybersecurity</h2>
          <p>With increased digitalization, cybersecurity has become a top priority for businesses and individuals.</p>
          
          <h2>7. Internet of Things (IoT)</h2>
          <p>Smart devices and IoT applications are becoming more common in Pakistani homes and businesses.</p>
          
          <h2>8. Blockchain Technology</h2>
          <p>Blockchain is being explored for various applications beyond cryptocurrency.</p>
          
          <h2>9. Remote Work Technology</h2>
          <p>Tools and platforms enabling remote work continue to evolve and gain adoption.</p>
          
          <h2>10. EdTech</h2>
          <p>Educational technology is transforming how Pakistanis learn and access education.</p>
          
          <h2>Conclusion</h2>
          <p>These technology trends are creating new opportunities for businesses and individuals in Pakistan. Stay informed and adapt to remain competitive.</p>
        `,
        featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        categoryId: technologyCategory.id,
        authorId: admin.id,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-09-10'),
        views: 189,
        isCommentingEnabled: true
      }
    ];

    // Create blog posts
    for (const postData of blogPosts) {
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug: postData.slug }
      });

      if (existingPost) {
        console.log(`⏭️  Post "${postData.title}" already exists, skipping...`);
        continue;
      }

      const post = await prisma.blogPost.create({
        data: postData
      });

      console.log(`✅ Created post: ${post.title}`);
    }

    console.log('\n🎉 Blog posts seeded successfully!');
    console.log('\nYou can now view these posts at:');
    blogPosts.forEach(post => {
      console.log(`   - http://localhost:3002/blog/${post.slug}`);
    });

  } catch (error) {
    console.error('❌ Error seeding blog posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBlogPosts();
