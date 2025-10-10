import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// GET - Get sales analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
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
          lte: new Date(endDate)
        }
      };
    } else {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));
      dateFilter = {
        createdAt: {
          gte: daysAgo
        }
      };
    }

    // Get sales overview
    const [
      totalSales,
      totalOrders,
      averageOrderValue,
      topProducts,
      salesByStatus,
      dailySales,
      monthlySales
    ] = await Promise.all([
      // Total sales amount
      prisma.order.aggregate({
        where: dateFilter,
        _sum: {
          totalPkr: true
        }
      }),
      
      // Total orders count
      prisma.order.count({
        where: dateFilter
      }),
      
      // Average order value
      prisma.order.aggregate({
        where: dateFilter,
        _avg: {
          totalPkr: true
        }
      }),
      
      // Top selling products
      prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: {
          order: dateFilter
        },
        _sum: {
          quantity: true,
          totalPrice: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      }),
      
      // Sales by order status
      prisma.order.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: {
          status: true
        },
        _sum: {
          totalPkr: true
        }
      }),
      
      // Daily sales for the last 30 days
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as orders,
          SUM(totalPkr) as revenue
        FROM orders 
        WHERE createdAt >= datetime('now', '-30 days')
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
      `,
      
      // Monthly sales for the last 12 months
      prisma.$queryRaw`
        SELECT 
          strftime('%Y-%m', createdAt) as month,
          COUNT(*) as orders,
          SUM(totalPkr) as revenue
        FROM orders 
        WHERE createdAt >= datetime('now', '-12 months')
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month DESC
      `
    ]);

    // Get customer analytics
    const [
      totalCustomers,
      newCustomers,
      repeatCustomers
    ] = await Promise.all([
      // Total customers who made orders
      prisma.user.count({
        where: {
          orders: {
            some: dateFilter
          }
        }
      }),
      
      // New customers (first order in period)
      prisma.user.count({
        where: {
          orders: {
            some: {
              ...dateFilter,
              // This is their first order
              user: {
                orders: {
                  none: {
                    createdAt: {
                      lt: dateFilter.createdAt?.gte || new Date(0)
                    }
                  }
                }
              }
            }
          }
        }
      }),
      
      // Repeat customers (more than one order in period)
      prisma.user.count({
        where: {
          orders: {
            some: dateFilter
          },
          _count: {
            orders: {
              gt: 1
            }
          }
        }
      })
    ]);

    // Get inventory alerts
    const lowStockProducts = await prisma.product.findMany({
      where: {
        quantity: { lte: 10 },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        price: true
      },
      orderBy: {
        quantity: 'asc'
      },
      take: 10
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: dateFilter,
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      overview: {
        totalSales: totalSales._sum.totalPkr || 0,
        totalOrders,
        averageOrderValue: averageOrderValue._avg.totalPkr || 0,
        totalCustomers,
        newCustomers,
        repeatCustomers
      },
      topProducts,
      salesByStatus,
      dailySales,
      monthlySales,
      lowStockProducts,
      recentOrders,
      period: {
        days: parseInt(period),
        startDate: startDate || dateFilter.createdAt?.gte?.toISOString(),
        endDate: endDate || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
