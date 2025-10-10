import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date and last month for comparison
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get analytics data
    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      totalCustomers,
      lowStockProducts,
      pendingOrders,
      currentMonthRevenue,
      lastMonthRevenue,
      topSellingProducts
    ] = await Promise.all([
      // Total products
      prisma.product.count({
        where: { status: { in: ['ACTIVE', 'PUBLISHED'] } }
      }),

      // Total orders
      prisma.order.count(),

      // Total revenue
      prisma.order.aggregate({
        _sum: { totalPkr: true },
        where: { paymentStatus: 'PAID' }
      }),

      // Total customers (unique users with orders)
      prisma.user.count({
        where: {
          orders: {
            some: {}
          }
        }
      }),

      // Low stock products (less than 10 items)
      prisma.product.count({
        where: {
          trackQuantity: true,
          quantity: { lt: 10 },
          status: { in: ['ACTIVE', 'PUBLISHED'] }
        }
      }),

      // Pending orders
      prisma.order.count({
        where: { status: 'PENDING' }
      }),

      // Current month revenue
      prisma.order.aggregate({
        _sum: { totalPkr: true },
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: currentMonth }
        }
      }),

      // Last month revenue
      prisma.order.aggregate({
        _sum: { totalPkr: true },
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: lastMonth,
            lt: currentMonth
          }
        }
      }),

      // Top selling products
      prisma.product.findMany({
        where: { status: { in: ['ACTIVE', 'PUBLISHED'] } },
        orderBy: { sales: 'desc' },
        take: 5,
        include: {
          category: {
            select: {
              name: true,
              color: true
            }
          }
        }
      })
    ]);

    // Calculate monthly growth
    const currentRevenue = currentMonthRevenue._sum.totalPkr || 0;
    const lastRevenue = lastMonthRevenue._sum.totalPkr || 0;
    const monthlyGrowth = lastRevenue > 0 
      ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
      : 0;

    const analytics = {
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPkr || 0,
      totalCustomers,
      lowStockProducts,
      pendingOrders,
      monthlyGrowth,
      topSellingProducts
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching e-commerce analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
