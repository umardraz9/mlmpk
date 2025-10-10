import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users except current user
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: session.user.id
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        image: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        image: user.avatar || user.image,
        avatar: user.avatar || user.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        joinDate: user.createdAt
      }))
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return NextResponse.json({
      error: 'Failed to fetch users',
      details: error.message
    }, { status: 500 });
  }
}
