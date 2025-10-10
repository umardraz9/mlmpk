import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

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
      const [
        totalUsers,
        activeUsers,
        todayRegistrations,
        totalOrders,
        pendingOrders,
        todayOrders,
        totalRevenue,
        monthlyRevenue,
        todayCommissions,
        activeTasks,
        pendingTasks,
        completedTasks,
        pendingWithdrawals,
        recentUsers,
        recentTaskCompletions,
        recentWithdrawals,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { createdAt: { gte: today } } }),
        prisma.order.aggregate({ _sum: { totalPkr: true } }).then(r => r._sum.totalPkr || 0),
        prisma.order.aggregate({ where: { createdAt: { gte: firstDayOfMonth } }, _sum: { totalPkr: true } }).then(r => r._sum.totalPkr || 0),
        prisma.taskCompletion.aggregate({ where: { completedAt: { gte: today } }, _sum: { reward: true } }).then(r => r._sum.reward || 0),
        prisma.task.count({ where: { status: 'ACTIVE' } }),
        prisma.taskCompletion.count({ where: { status: 'PENDING' } }),
        prisma.taskCompletion.count({ where: { status: 'COMPLETED' } }),
        prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
        prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true } }),
        prisma.taskCompletion.findMany({ where: { status: 'COMPLETED' }, orderBy: { completedAt: 'desc' }, take: 5, include: { user: { select: { name: true } }, task: { select: { title: true } } } }),
        prisma.withdrawalRequest.findMany({ where: { status: 'PENDING' }, orderBy: { requestedAt: 'desc' }, take: 5, include: { user: { select: { name: true } } } }),
      ]);

      return {
        totalUsers,
        activeUsers,
        totalRevenue,
        monthlyRevenue,
        totalOrders,
        pendingOrders,
        totalCommissions: totalRevenue,
        activeTasks,
        pendingWithdrawals,
        todayRegistrations,
        todayOrders,
        todayCommissions,
        pendingTasks,
        completedTasks,
        recentActivity: {
          registrations: recentUsers,
          taskCompletions: recentTaskCompletions,
          withdrawals: recentWithdrawals,
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
