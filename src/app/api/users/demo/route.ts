import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET() {
  try {
    // Find the demo user
    const demoUser = await prisma.user.findUnique({
      where: {
        email: 'demouser@example.com'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!demoUser) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: demoUser
    });

  } catch (error) {
    console.error('Error fetching demo user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
