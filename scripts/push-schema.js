#!/usr/bin/env node

/**
 * Push Prisma Schema to Production Database
 * This ensures all tables (including SocialPost) exist
 */

const { execSync } = require('child_process');

// Use pooler connection for both (direct connection not accessible from local network)
const DATABASE_URL = 'postgresql://postgres.sfmeemhtjxwseuvzcjyd:Aa69669900%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres';
const DIRECT_URL = 'postgresql://postgres.sfmeemhtjxwseuvzcjyd:Aa69669900%40@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

// Set environment variables for Prisma
process.env.DATABASE_URL = DATABASE_URL;
process.env.DIRECT_URL = DIRECT_URL;

console.log('🚀 Pushing Prisma schema to database...\n');
console.log('This will create all missing tables including:');
console.log('- SocialPost');
console.log('- SocialComment');
console.log('- SocialLike');
console.log('- And all other models\n');

try {
  execSync('npx prisma db push --skip-generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL,
      DIRECT_URL
    }
  });
  
  console.log('\n✅ Schema pushed successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. The database now has all required tables');
  console.log('2. Try accessing /social page again');
  console.log('3. It should work now!\n');
  
} catch (error) {
  console.error('\n❌ Failed to push schema');
  console.error('Error:', error.message);
  process.exit(1);
}
