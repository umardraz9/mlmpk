const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAnalyticsData() {
  console.log('🌱 Seeding analytics data...');

  try {
    // Create sample users with different roles
    const users = [];
    for (let i = 0; i < 50; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          username: `user${i + 1}`,
          password: hashedPassword,
          role: i === 0 ? 'ADMIN' : 'USER',
          isActive: Math.random() > 0.1, // 90% active
          isAdmin: i === 0,
          sponsorId: i > 0 ? users[Math.floor(Math.random() * Math.min(i, 10))]?.id : null,
          totalEarnings: Math.floor(Math.random() * 10000),
          totalPoints: Math.floor(Math.random() * 5000),
          tasksCompleted: Math.floor(Math.random() * 50),
          balance: Math.floor(Math.random() * 5000),
          pendingCommission: Math.floor(Math.random() * 1000),
          availableVoucherPkr: Math.floor(Math.random() * 500),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)) // Random date within last 90 days
        }
      });
      users.push(user);
    }

    // Create sample blog categories
    const categories = [];
    const categoryNames = ['Technology', 'Business', 'Health', 'Lifestyle', 'Education'];
    for (const name of categoryNames) {
      const category = await prisma.blogCategory.create({
        data: {
          name,
          slug: name.toLowerCase(),
          description: `Content related to ${name}`,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          isActive: true
        }
      });
      categories.push(category);
    }

    // Create sample blog tags
    const tags = [];
    const tagNames = ['trending', 'tips', 'guide', 'news', 'tutorial', 'review'];
    for (const name of tagNames) {
      const tag = await prisma.blogTag.create({
        data: {
          name,
          slug: name,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`
        }
      });
      tags.push(tag);
    }

    // Create sample blog posts
    const posts = [];
    for (let i = 0; i < 30; i++) {
      const post = await prisma.blogPost.create({
        data: {
          title: `Blog Post ${i + 1}: Sample Title`,
          slug: `blog-post-${i + 1}`,
          content: `This is the content for blog post ${i + 1}. It contains detailed information about the topic.`,
          excerpt: `This is a brief excerpt for blog post ${i + 1}.`,
          status: Math.random() > 0.2 ? 'PUBLISHED' : 'DRAFT',
          publishedAt: Math.random() > 0.2 ? new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)) : null,
          authorId: users[Math.floor(Math.random() * Math.min(users.length, 10))].id,
          categoryId: categories[Math.floor(Math.random() * categories.length)].id,
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100),
          shares: Math.floor(Math.random() * 50),
          metaTitle: `Meta title for blog post ${i + 1}`,
          metaDescription: `Meta description for blog post ${i + 1}`,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
        }
      });
      posts.push(post);
    }

    // Create sample blog comments
    for (let i = 0; i < 100; i++) {
      await prisma.blogComment.create({
        data: {
          content: `This is comment ${i + 1} on a blog post.`,
          authorId: users[Math.floor(Math.random() * users.length)].id,
          postId: posts[Math.floor(Math.random() * posts.length)].id,
          isApproved: Math.random() > 0.1,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000))
        }
      });
    }

    // Create sample products
    const products = [];
    const productCategories = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports'];
    for (let i = 0; i < 25; i++) {
      const product = await prisma.product.create({
        data: {
          name: `Product ${i + 1}`,
          slug: `product-${i + 1}`,
          description: `This is a detailed description for product ${i + 1}.`,
          price: Math.floor(Math.random() * 1000) + 100,
          comparePrice: Math.floor(Math.random() * 1500) + 150,
          costPrice: Math.floor(Math.random() * 500) + 50,
          sku: `SKU${i + 1}`,
          quantity: Math.floor(Math.random() * 100),
          minQuantity: 10,
          status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
          images: JSON.stringify([`/images/product-${i + 1}.jpg`]),
          category: productCategories[Math.floor(Math.random() * productCategories.length)],
          tags: JSON.stringify(['featured', 'popular']),
          views: Math.floor(Math.random() * 500),
          sales: Math.floor(Math.random() * 100),
          rating: Math.random() * 5,
          reviewCount: Math.floor(Math.random() * 50),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
        }
      });
      products.push(product);
    }

    // Create sample orders
    const orders = [];
    const orderStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const paymentStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
    for (let i = 0; i < 100; i++) {
      const order = await prisma.order.create({
        data: {
          userId: users[Math.floor(Math.random() * users.length)].id,
          orderNumber: `ORD-${Date.now()}-${i}`,
          items: JSON.stringify([
            {
              productId: products[Math.floor(Math.random() * products.length)].id,
              quantity: Math.floor(Math.random() * 3) + 1,
              price: Math.floor(Math.random() * 500) + 100
            }
          ]),
          subtotalPkr: Math.floor(Math.random() * 1000) + 200,
          voucherUsedPkr: Math.floor(Math.random() * 100),
          shippingPkr: Math.floor(Math.random() * 100) + 50,
          totalPkr: Math.floor(Math.random() * 1200) + 300,
          paidAmountPkr: Math.random() > 0.3 ? Math.floor(Math.random() * 1200) + 300 : 0,
          status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          paymentMethod: Math.random() > 0.5 ? 'EASYPAISA' : 'JAZZCASH',
          paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
          shippingAddress: `Address ${i + 1}, City, Pakistan`,
          city: 'Karachi',
          trackingNumber: Math.random() > 0.5 ? `TRK${Date.now()}${i}` : null,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
        }
      });
      orders.push(order);
    }

    // Create sample tasks
    const tasks = [];
    const taskTypes = ['DAILY', 'WEEKLY', 'MONTHLY', 'ACHIEVEMENT', 'REFERRAL'];
    const taskCategories = ['Social Media', 'Sales', 'Learning', 'Engagement', 'Referrals'];
    const taskDifficulties = ['EASY', 'MEDIUM', 'HARD'];
    for (let i = 0; i < 20; i++) {
      const task = await prisma.task.create({
        data: {
          title: `Task ${i + 1}: Sample Task`,
          description: `This is a description for task ${i + 1}.`,
          type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
          category: taskCategories[Math.floor(Math.random() * taskCategories.length)],
          difficulty: taskDifficulties[Math.floor(Math.random() * taskDifficulties.length)],
          reward: Math.floor(Math.random() * 500) + 50,
          status: Math.random() > 0.1 ? 'ACTIVE' : 'INACTIVE',
          target: Math.floor(Math.random() * 10) + 1,
          timeLimit: Math.random() > 0.5 ? Math.floor(Math.random() * 24) + 1 : null,
          instructions: `Complete this task by following these instructions for task ${i + 1}.`,
          icon: 'target',
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          completions: Math.floor(Math.random() * 50),
          attempts: Math.floor(Math.random() * 100) + 50,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
        }
      });
      tasks.push(task);
    }

    // Create sample task completions
    for (let i = 0; i < 200; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      
      try {
        await prisma.taskCompletion.create({
          data: {
            userId: user.id,
            taskId: task.id,
            status: Math.random() > 0.3 ? 'COMPLETED' : Math.random() > 0.5 ? 'IN_PROGRESS' : 'PENDING',
            progress: Math.floor(Math.random() * 100),
            reward: Math.random() > 0.3 ? task.reward : 0,
            notes: `Completion notes for task ${task.title}`,
            startedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
            completedAt: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 20 * 24 * 60 * 60 * 1000)) : null,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
          }
        });
      } catch (error) {
        // Skip if duplicate user-task combination
        continue;
      }
    }

    console.log('✅ Analytics data seeded successfully!');
    console.log(`Created: ${users.length} users, ${posts.length} blog posts, ${products.length} products, ${orders.length} orders, ${tasks.length} tasks`);

  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedAnalyticsData();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedAnalyticsData }; 