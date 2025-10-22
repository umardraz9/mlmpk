import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fallback = {
      totalUsers: 0,
      activeUsers: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalCommissions: 0,
      activeTasks: 0,
      pendingWithdrawals: 0,
      todayRegistrations: 0,
      todayOrders: 0,
      todayCommissions: 0,
      pendingTasks: 0,
      completedTasks: 0,
      recentActivity: { registrations: [], taskCompletions: [], withdrawals: [] },
      _partial: true,
    };

    const computeStats = async () => {
      // Get basic stats from Supabase
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true);

      const { count: todayRegistrations } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', today.toISOString());

      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, name, email')
        .order('createdAt', { ascending: false })
        .limit(5);

      // Return stats with mock data for now
      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalRevenue: 125000,
        monthlyRevenue: 45000,
        totalOrders: 234,
        pendingOrders: 12,
        totalCommissions: 25000,
        activeTasks: 8,
        pendingWithdrawals: 3,
        todayRegistrations: todayRegistrations || 0,
        todayOrders: 5,
        todayCommissions: 1500,
        pendingTasks: 15,
        completedTasks: 189,
        recentActivity: {
          registrations: recentUsers || [],
          taskCompletions: [],
          withdrawals: [],
        },
      };
    };

    try {
      const result = await Promise.race([
        computeStats(),
        new Promise((resolve) => setTimeout(() => resolve(fallback), 3000)),
      ]);
      return NextResponse.json(result as any);
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in dashboard stats route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
