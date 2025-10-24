import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

interface NotificationRow {
  id: string;
  title: string;
  message?: string | null;
  content?: string | null;
  type?: string | null;
  category?: string | null;
  isRead?: boolean | null;
  read?: boolean | null;
  createdAt: string;
  data?: unknown;
  createdBy?: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Fetch notifications for current user from Supabase
    const { data: rows, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications from Supabase:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Count unread notifications (read=false or isRead=false)
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('userId', session.user.id)
      .or('read.eq.false,isRead.eq.false');

    const rowsTyped = (rows || []) as NotificationRow[];
    const notifications = rowsTyped.map((notif: NotificationRow) => ({
      id: notif.id,
      title: notif.title,
      message: notif.message ?? notif.content ?? '',
      type: typeof notif.type === 'string' ? notif.type : 'info',
      category: notif.category ?? null,
      isRead: typeof notif.isRead === 'boolean' ? notif.isRead : Boolean(notif.read),
      createdAt: notif.createdAt,
      data: notif.data ?? null,
      sender: notif.createdBy || null,
      timeAgo: getTimeAgo(new Date(notif.createdAt))
    }));

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: unreadCount || 0,
      totalCount: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications for display:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
