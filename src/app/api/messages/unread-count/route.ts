import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Demo unread count
    const unreadCount = 3;

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
