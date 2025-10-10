// Simple database connection test
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test if tables exist by counting users
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users`);

    // Test social posts
    const postCount = await prisma.socialPost.count();
    console.log(`✅ Found ${postCount} social posts`);

    // Test social likes
    const likeCount = await prisma.socialLike.count();
    console.log(`✅ Found ${likeCount} social likes`);

    console.log('✅ All database tables are accessible');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
