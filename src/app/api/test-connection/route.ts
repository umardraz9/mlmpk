// Test Database Connection
// Simple test to see if we can connect at all

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  let prisma: PrismaClient | undefined;

  try {
    prisma = new PrismaClient();

    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      result: result
    });

  } catch (error: any) {
    console.error('Database connection error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: {
        hasPrisma: !!prisma,
        connectionString: process.env.DATABASE_URL ? 'present' : 'missing',
        maskedUrl: process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@')
      }
    }, { status: 500 });

  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
