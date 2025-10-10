import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Count unread messages for the current user
    const unreadCount = await prisma.directMessage.count({
      where: {
        recipientId: session.user.id,
        status: {
          in: ['sent', 'delivered'] // Not 'read'
        },
        isDeleted: false
      }
    });

    return NextResponse.json({
      success: true,
      count: unreadCount,
      unreadCount // Keep for backward compatibility
    });

  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    return NextResponse.json({
      error: 'Failed to get unread count'
    }, { status: 500 });
  }
}
