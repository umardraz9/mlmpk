// Test Supabase Connection Script
// Run this with: node test-supabase-connection.js

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing Supabase database connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Connected to database successfully!\n');
    
    // Test query execution
    console.log('2. Testing query execution...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Query executed successfully!');
    console.log('📊 Database version:', result[0].version, '\n');
    
    // Test table access
    console.log('3. Testing table access...');
    const userCount = await prisma.user.count();
    console.log('✅ Table access successful!');
    console.log('👥 Current user count:', userCount, '\n');
    
    // Test table structure
    console.log('4. Testing table structure...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('✅ Found', tables.length, 'tables in database');
    console.log('📋 Tables:', tables.map(t => t.table_name).join(', '), '\n');
    
    console.log('🎉 ALL TESTS PASSED! Your Supabase database is ready!');
    console.log('🚀 You can now deploy to Vercel without any issues!');
    
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error('Error:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your .env.local file exists');
    console.log('2. Verify DATABASE_URL has the correct password');
    console.log('3. Ensure no extra spaces in environment variables');
    console.log('4. Check your internet connection');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
