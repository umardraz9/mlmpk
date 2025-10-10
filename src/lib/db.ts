import prisma from '@/lib/prisma';

// Backwards-compatible export name used across the codebase
export const db = prisma;

// Test database connection
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}