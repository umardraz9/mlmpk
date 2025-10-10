import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBlogData() {
  console.log('🌱 Seeding blog data...');

  // Create blog categories
  const categories = [
    {
      name: 'MLM Success Stories',
      slug: 'mlm-success-stories',
      description: 'Real success stories from MLM-Pak members',
      color: '#10B981'
    },
    {
      name: 'Business Tips',
      slug: 'business-tips',
      description: 'Tips and strategies for building your MLM business',
      color: '#3B82F6'
    },
    {
      name: 'Product Reviews',
      slug: 'product-reviews',
      description: 'Reviews and guides for our products',
      color: '#F59E0B'
    },
    {
      name: 'Training & Education',
      slug: 'training-education',
      description: 'Educational content and training materials',
      color: '#8B5CF6'
    },
    {
      name: 'Company News',
      slug: 'company-news',
      description: 'Latest news and updates from MLM-Pak',
      color: '#EF4444'
    },
    {
      name: 'Investment Guide',
      slug: 'investment-guide',
      description: 'Investment strategies and financial planning',
      color: '#06B6D4'
    }
  ];

  // Create blog tags
  const tags = [
    { name: 'MLM', slug: 'mlm', color: '#10B981' },
    { name: 'Success', slug: 'success', color: '#F59E0B' },
    { name: 'Business', slug: 'business', color: '#3B82F6' },
    { name: 'Marketing', slug: 'marketing', color: '#8B5CF6' },
    { name: 'Investment', slug: 'investment', color: '#06B6D4' },
    { name: 'Training', slug: 'training', color: '#EF4444' },
    { name: 'Strategy', slug: 'strategy', color: '#10B981' },
    { name: 'Tips', slug: 'tips', color: '#F59E0B' },
    { name: 'Guide', slug: 'guide', color: '#3B82F6' },
    { name: 'Review', slug: 'review', color: '#8B5CF6' },
    { name: 'Earning', slug: 'earning', color: '#06B6D4' },
    { name: 'Team Building', slug: 'team-building', color: '#EF4444' },
    { name: 'Network', slug: 'network', color: '#10B981' },
    { name: 'Leadership', slug: 'leadership', color: '#F59E0B' },
    { name: 'Motivation', slug: 'motivation', color: '#3B82F6' }
  ];

  // Insert categories
  for (const category of categories) {
    await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    });
  }

  // Insert tags
  for (const tag of tags) {
    await prisma.blogTag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag
    });
  }

  console.log('✅ Blog data seeded successfully!');
  console.log(`   - Created ${categories.length} categories`);
  console.log(`   - Created ${tags.length} tags`);
}

seedBlogData()
  .catch((e) => {
    console.error('❌ Error seeding blog data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 