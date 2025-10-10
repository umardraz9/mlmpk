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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };
    } else {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));
      dateFilter = {
        createdAt: { gte: daysAgo }
      };
    }

    // Get comprehensive sales data
    const [
      totalSales,
      paidOrders,
      salesByDay,
      salesByCategory,
      salesByPaymentMethod,
      topProducts,
      topCustomers,
      averageOrderValue,
      conversionRate,
      refundData
    ] = await Promise.all([
      // Total sales amount
      prisma.order.aggregate({
        _sum: { totalPkr: true },
        _count: { id: true },
        where: { ...dateFilter, paymentStatus: 'PAID' }
      }),

      // Paid orders count
      prisma.order.count({
        where: { ...dateFilter, paymentStatus: 'PAID' }
      }),

      // Daily sales breakdown
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as orders,
          SUM(totalPkr) as revenue
        FROM orders 
        WHERE paymentStatus = 'PAID' 
        AND createdAt >= ${dateFilter.createdAt?.gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
      `,

      // Sales by category (through order items)
      prisma.$queryRaw`
        SELECT 
          pc.name as category,
          pc.color as color,
          COUNT(oi.id) as items_sold,
          SUM(oi.totalPrice) as revenue
        FROM order_items oi
        JOIN products p ON oi.productId = p.id
        JOIN product_categories pc ON p.categoryId = pc.id
        JOIN orders o ON oi.orderId = o.id
        WHERE o.paymentStatus = 'PAID'
        AND o.createdAt >= ${dateFilter.createdAt?.gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY pc.id, pc.name, pc.color
        ORDER BY revenue DESC
      `,

      // Sales by payment method
      prisma.order.groupBy({
        by: ['paymentMethod'],
        _count: { id: true },
        _sum: { totalPkr: true },
        where: { ...dateFilter, paymentStatus: 'PAID' },
        orderBy: { _sum: { totalPkr: 'desc' } }
      }),

      // Top selling products
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.price,
          pc.name as category,
          COUNT(oi.id) as quantity_sold,
          SUM(oi.totalPrice) as revenue
        FROM order_items oi
        JOIN products p ON oi.productId = p.id
        LEFT JOIN product_categories pc ON p.categoryId = pc.id
        JOIN orders o ON oi.orderId = o.id
        WHERE o.paymentStatus = 'PAID'
        AND o.createdAt >= ${dateFilter.createdAt?.gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY p.id, p.name, p.price, pc.name
        ORDER BY quantity_sold DESC
        LIMIT 10
      `,

      // Top customers
      prisma.order.groupBy({
        by: ['userId'],
        _count: { id: true },
        _sum: { totalPkr: true },
        where: { ...dateFilter, paymentStatus: 'PAID' },
        orderBy: { _sum: { totalPkr: 'desc' } },
        take: 10
      }),

      // Average order value
      prisma.order.aggregate({
        _avg: { totalPkr: true },
        where: { ...dateFilter, paymentStatus: 'PAID' }
      }),

      // Conversion rate (orders vs total users)
      prisma.user.count(),

      // Refund data
      prisma.order.aggregate({
        _sum: { totalPkr: true },
        _count: { id: true },
        where: { ...dateFilter, paymentStatus: 'REFUNDED' }
      })
    ]);

    // Get customer details for top customers
    const topCustomersWithDetails = await Promise.all(
      topCustomers.map(async (customer) => {
        const user = await prisma.user.findUnique({
          where: { id: customer.userId },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        });
        return {
          ...customer,
          user
        };
      })
    );

    // Calculate metrics
    const totalRevenue = totalSales._sum.totalPkr || 0;
    const totalOrders = totalSales._count.id || 0;
    const avgOrderValue = averageOrderValue._avg.totalPkr || 0;
    const refundAmount = refundData._sum.totalPkr || 0;
    const refundRate = totalRevenue > 0 ? (refundAmount / totalRevenue) * 100 : 0;

    const salesReport = {
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: avgOrderValue,
        refundAmount,
        refundRate: Math.round(refundRate * 100) / 100,
        period: parseInt(period)
      },
      trends: {
        dailySales: salesByDay,
        salesByCategory,
        salesByPaymentMethod
      },
      topPerformers: {
        products: topProducts,
        customers: topCustomersWithDetails
      },
      analytics: {
        conversionRate: totalOrders > 0 ? (totalOrders / conversionRate) * 100 : 0,
        repeatCustomerRate: 0, // Would need more complex query
        averageItemsPerOrder: 0 // Would need order items count
      }
    };

    return NextResponse.json(salesReport);
  } catch (error) {
    console.error('Error generating sales report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
