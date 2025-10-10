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
    const period = searchParams.get('period') || '30';
    const segment = searchParams.get('segment') || 'all';

    // Calculate date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get customer analytics
    const [
      totalCustomers,
      newCustomers,
      activeCustomers,
      customerLifetimeValue,
      customerSegments,
      customerGrowth,
      topSpenders,
      customerRetention,
      averageOrdersPerCustomer
    ] = await Promise.all([
      // Total customers
      prisma.user.count(),

      // New customers in period
      prisma.user.count({
        where: { createdAt: { gte: daysAgo } }
      }),

      // Active customers (with orders in period)
      prisma.user.count({
        where: {
          orders: {
            some: {
              createdAt: { gte: daysAgo },
              paymentStatus: 'PAID'
            }
          }
        }
      }),

      // Customer lifetime value
      prisma.$queryRaw`
        SELECT 
          AVG(customer_value) as avg_clv,
          MAX(customer_value) as max_clv,
          MIN(customer_value) as min_clv
        FROM (
          SELECT 
            userId,
            SUM(totalPkr) as customer_value
          FROM orders 
          WHERE paymentStatus = 'PAID'
          GROUP BY userId
        ) customer_totals
      `,

      // Customer segments by order count
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN order_count = 1 THEN 'One-time'
            WHEN order_count BETWEEN 2 AND 5 THEN 'Regular'
            WHEN order_count BETWEEN 6 AND 10 THEN 'Loyal'
            ELSE 'VIP'
          END as segment,
          COUNT(*) as customer_count,
          AVG(total_spent) as avg_spent
        FROM (
          SELECT 
            userId,
            COUNT(*) as order_count,
            SUM(totalPkr) as total_spent
          FROM orders 
          WHERE paymentStatus = 'PAID'
          GROUP BY userId
        ) customer_stats
        GROUP BY segment
      `,

      // Customer growth over time
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as new_customers
        FROM users 
        WHERE createdAt >= ${daysAgo}
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,

      // Top spending customers
      prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.createdAt,
          COUNT(o.id) as total_orders,
          SUM(o.totalPkr) as total_spent,
          AVG(o.totalPkr) as avg_order_value,
          MAX(o.createdAt) as last_order_date
        FROM users u
        JOIN orders o ON u.id = o.userId
        WHERE o.paymentStatus = 'PAID'
        GROUP BY u.id, u.name, u.email, u.createdAt
        ORDER BY total_spent DESC
        LIMIT 20
      `,

      // Customer retention (customers who made repeat purchases)
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT userId) as repeat_customers
        FROM orders 
        WHERE paymentStatus = 'PAID'
        AND userId IN (
          SELECT userId 
          FROM orders 
          WHERE paymentStatus = 'PAID'
          GROUP BY userId 
          HAVING COUNT(*) > 1
        )
      `,

      // Average orders per customer
      prisma.$queryRaw`
        SELECT 
          AVG(order_count) as avg_orders_per_customer
        FROM (
          SELECT 
            userId,
            COUNT(*) as order_count
          FROM orders 
          WHERE paymentStatus = 'PAID'
          GROUP BY userId
        ) customer_orders
      `
    ]);

    // Calculate retention rate
    const totalCustomersWithOrders = await prisma.user.count({
      where: {
        orders: {
          some: { paymentStatus: 'PAID' }
        }
      }
    });

    const retentionRate = totalCustomersWithOrders > 0 
      ? (customerRetention[0]?.repeat_customers / totalCustomersWithOrders) * 100 
      : 0;

    const customerReport = {
      summary: {
        totalCustomers,
        newCustomers,
        activeCustomers,
        retentionRate: Math.round(retentionRate * 100) / 100,
        averageLifetimeValue: customerLifetimeValue[0]?.avg_clv || 0,
        averageOrdersPerCustomer: averageOrdersPerCustomer[0]?.avg_orders_per_customer || 0
      },
      segments: customerSegments,
      growth: customerGrowth,
      topCustomers: topSpenders,
      analytics: {
        newCustomerRate: totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0,
        activeCustomerRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0,
        maxLifetimeValue: customerLifetimeValue[0]?.max_clv || 0,
        minLifetimeValue: customerLifetimeValue[0]?.min_clv || 0
      }
    };

    return NextResponse.json(customerReport);
  } catch (error) {
    console.error('Error generating customer report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
