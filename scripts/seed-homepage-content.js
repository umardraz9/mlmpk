const { PrismaClient } = require('@prisma/client');

// Use direct connection string for development
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function seedHomepageContent() {
  try {
    console.log('🌱 Seeding homepage content...');

    // Create blog categories first
    const techCategory = await prisma.blogCategory.upsert({
      where: { slug: 'technology' },
      update: {},
      create: {
        name: 'Technology',
        slug: 'technology',
        description: 'Latest technology trends and insights'
      }
    });

    const businessCategory = await prisma.blogCategory.upsert({
      where: { slug: 'business' },
      update: {},
      create: {
        name: 'Business',
        slug: 'business',
        description: 'Business strategies and entrepreneurship'
      }
    });

    const lifestyleCategory = await prisma.blogCategory.upsert({
      where: { slug: 'lifestyle' },
      update: {},
      create: {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Lifestyle tips and personal development'
      }
    });

    // Find or create an admin user for blog posts
    let adminUser = await prisma.user.findFirst({
      where: { isAdmin: true }
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@mcnmart.com',
          name: 'MCNmart Admin',
          isAdmin: true,
          role: 'ADMIN',
          referralCode: 'ADMIN001'
        }
      });
    }

    // Create featured blog posts
    const blogPosts = [
      {
        title: 'The Future of E-commerce in Pakistan',
        slug: 'future-ecommerce-pakistan',
        content: `
          <h2>The Digital Revolution in Pakistan</h2>
          <p>Pakistan's e-commerce sector is experiencing unprecedented growth, with online sales reaching new heights every year. The rise of digital payment systems like JazzCash and EasyPaisa has made online shopping more accessible to millions of Pakistanis.</p>
          
          <h3>Key Trends Shaping the Market</h3>
          <ul>
            <li>Mobile-first shopping experiences</li>
            <li>Social commerce integration</li>
            <li>Cash on delivery preferences</li>
            <li>Local payment gateway adoption</li>
          </ul>
          
          <p>MCNmart.com is at the forefront of this revolution, combining traditional business models with modern technology to create opportunities for Pakistani entrepreneurs.</p>
          
          <h3>Opportunities for Growth</h3>
          <p>The partnership program model allows individuals to participate in the digital economy without requiring extensive technical knowledge or large capital investments. With just PKR 1,000, anyone can start their journey in the digital marketplace.</p>
        `,
        excerpt: 'Discover how Pakistan\'s e-commerce landscape is evolving and creating new opportunities for entrepreneurs.',
        featuredImage: '/images/ecommerce-pakistan.svg',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        featured: true,
        categoryId: techCategory.id,
        authorId: adminUser.id,
        metaTitle: 'The Future of E-commerce in Pakistan - MCNmart.com',
        metaDescription: 'Explore the growing e-commerce opportunities in Pakistan and how MCNmart.com is leading the digital transformation.',
        views: 1250,
        likes: 89
      },
      {
        title: 'Building Passive Income Through Social Sales',
        slug: 'passive-income-social-sales',
        content: `
          <h2>Understanding Social Sales</h2>
          <p>Social sales represents a new way of doing business that combines the power of social networks with traditional commerce. Unlike traditional MLM models, social sales focuses on genuine value creation and community building.</p>
          
          <h3>The MCNmart.com Approach</h3>
          <p>Our 5-level partnership program is designed to reward genuine engagement and value creation. Each level provides specific benefits:</p>
          
          <ul>
            <li><strong>Level 1 (20%):</strong> Direct partnerships with immediate rewards</li>
            <li><strong>Level 2 (15%):</strong> Extended network benefits</li>
            <li><strong>Level 3 (10%):</strong> Community building rewards</li>
            <li><strong>Level 4 (8%):</strong> Leadership development income</li>
            <li><strong>Level 5 (7%):</strong> Long-term passive income</li>
          </ul>
          
          <h3>Building Your Network</h3>
          <p>Success in social sales comes from helping others succeed. By focusing on education, support, and genuine value creation, you can build a sustainable income stream that benefits everyone in your network.</p>
        `,
        excerpt: 'Learn how to build sustainable passive income through our innovative social sales partnership program.',
        featuredImage: '/images/passive-income.svg',
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        featured: true,
        categoryId: businessCategory.id,
        authorId: adminUser.id,
        metaTitle: 'Building Passive Income Through Social Sales - MCNmart.com',
        metaDescription: 'Discover how to create sustainable passive income through social sales and partnership programs.',
        views: 2100,
        likes: 156
      },
      {
        title: 'Digital Lifestyle: Balancing Work and Technology',
        slug: 'digital-lifestyle-balance',
        content: `
          <h2>The Modern Digital Lifestyle</h2>
          <p>In today's connected world, finding the right balance between technology and personal well-being is crucial. The rise of remote work and digital entrepreneurship has created new opportunities but also new challenges.</p>
          
          <h3>Benefits of Digital Entrepreneurship</h3>
          <ul>
            <li>Flexible working hours</li>
            <li>Location independence</li>
            <li>Scalable income potential</li>
            <li>Skill development opportunities</li>
          </ul>
          
          <h3>Managing Digital Overwhelm</h3>
          <p>While technology offers incredible opportunities, it's important to maintain boundaries. Set specific times for checking emails, social media, and business updates. Focus on quality interactions rather than constant connectivity.</p>
          
          <h3>Building Healthy Digital Habits</h3>
          <p>Success in the digital economy requires discipline and good habits. Create routines that support both your business goals and personal well-being. Remember, sustainable success comes from consistent, balanced effort.</p>
        `,
        excerpt: 'Explore strategies for maintaining a healthy balance in our increasingly digital world.',
        featuredImage: '/images/digital-lifestyle.svg',
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        featured: true,
        categoryId: lifestyleCategory.id,
        authorId: adminUser.id,
        metaTitle: 'Digital Lifestyle: Balancing Work and Technology - MCNmart.com',
        metaDescription: 'Learn how to maintain a healthy balance between digital entrepreneurship and personal well-being.',
        views: 890,
        likes: 67
      }
    ];

    // Create blog posts
    for (const post of blogPosts) {
      await prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: post,
        create: post
      });
    }

    // Create featured products
    const products = [
      {
        name: 'Premium Business Starter Kit',
        slug: 'premium-business-starter-kit',
        description: 'Complete business starter package including marketing materials, training resources, and exclusive access to our partnership program. Perfect for new entrepreneurs looking to start their journey with MCNmart.com.',
        price: 2500.00,
        comparePrice: 3500.00,
        costPrice: 1800.00,
        sku: 'BSK-001',
        quantity: 100,
        status: 'ACTIVE',
        images: JSON.stringify(['/images/business-starter-kit.svg']),
        category: 'Business Tools',
        tags: 'business,starter,kit,marketing,training',
        metaTitle: 'Premium Business Starter Kit - MCNmart.com',
        metaDescription: 'Complete business starter package with marketing materials and training resources.',
        trending: true,
        rating: 4.8,
        reviewCount: 45,
        sales: 230
      },
      {
        name: 'Digital Marketing Masterclass',
        slug: 'digital-marketing-masterclass',
        description: 'Comprehensive digital marketing course covering social media marketing, content creation, and online advertising strategies. Includes lifetime access to updates and exclusive community membership.',
        price: 1500.00,
        comparePrice: 2200.00,
        costPrice: 800.00,
        sku: 'DMM-001',
        quantity: 50,
        status: 'ACTIVE',
        images: JSON.stringify(['/images/digital-marketing-course.svg']),
        category: 'Education',
        tags: 'marketing,course,digital,social media,education',
        metaTitle: 'Digital Marketing Masterclass - MCNmart.com',
        metaDescription: 'Learn digital marketing strategies with our comprehensive masterclass course.',
        trending: true,
        rating: 4.9,
        reviewCount: 78,
        sales: 156
      },
      {
        name: 'MCNmart Success Journal',
        slug: 'mcnmart-success-journal',
        description: 'Beautifully designed success journal with goal-setting templates, daily planners, and motivational quotes. Track your progress and stay motivated on your entrepreneurial journey.',
        price: 800.00,
        comparePrice: 1200.00,
        costPrice: 400.00,
        sku: 'MSJ-001',
        quantity: 200,
        status: 'ACTIVE',
        images: JSON.stringify(['/images/success-journal.svg']),
        category: 'Lifestyle',
        tags: 'journal,success,planner,motivation,goals',
        metaTitle: 'MCNmart Success Journal - MCNmart.com',
        metaDescription: 'Track your entrepreneurial journey with our beautifully designed success journal.',
        trending: true,
        rating: 4.7,
        reviewCount: 92,
        sales: 340
      }
    ];

    // Create products
    for (const product of products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: product,
        create: product
      });
    }

    console.log('✅ Homepage content seeded successfully!');
    console.log('📝 Created 3 featured blog posts');
    console.log('🛍️ Created 3 featured products');
    
  } catch (error) {
    console.error('❌ Error seeding homepage content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedHomepageContent();
