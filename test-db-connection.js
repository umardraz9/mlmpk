// Quick test to see if Prisma can connect
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('Testing Prisma connection to Supabase...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  console.log('DIRECT_URL:', process.env.DIRECT_URL?.substring(0, 50) + '...');
  
  try {
    // Try a simple query
    const count = await prisma.user.count();
    console.log('✅ SUCCESS! Connected to database');
    console.log(`Found ${count} users`);
    
    // Try social posts
    const postsCount = await prisma.socialPost.count();
    console.log(`Found ${postsCount} social posts`);
    
  } catch (error) {
    console.error('❌ ERROR connecting to database:');
    console.error(error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
