// Database Setup Endpoint - Run once to create all tables
// Access at: https://mlmpk.vercel.app/api/setup-database

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting database setup...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Check if tables exist by trying to count users
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table exists with ${userCount} users`);
    } catch (e) {
      console.log('❌ User table check failed:', e);
    }
    
    // Check if SocialPost table exists
    try {
      const postCount = await prisma.socialPost.count();
      console.log(`✅ SocialPost table exists with ${postCount} posts`);
      
      return NextResponse.json({
        success: true,
        message: 'Database is already set up!',
        tables: {
          users: await prisma.user.count(),
          socialPosts: postCount,
          socialComments: await prisma.socialComment.count(),
          socialLikes: await prisma.socialLike.count(),
        }
      });
      
    } catch (error: any) {
      // SocialPost table doesn't exist
      console.log('❌ SocialPost table missing');
      
      return NextResponse.json({
        success: false,
        error: 'Social tables are missing. You need to run: npx prisma db push',
        message: 'The schema needs to be pushed to the database',
        instructions: [
          '1. The social feature tables (SocialPost, SocialComment, etc.) are missing',
          '2. You need to push the Prisma schema to create them',
          '3. Since direct connection is blocked, we need to use a migration approach',
          '4. Contact support or use Supabase SQL editor to run migrations'
        ],
        errorDetails: error.message
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Failed to connect to database or check tables'
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}
