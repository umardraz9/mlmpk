import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';
    const category = searchParams.get('category');

    // Calculate date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Build where clause for filtering
    const whereClause: any = {
      createdAt: { gte: daysAgo },
      paymentStatus: 'PAID'
    };

    const [
      bestSellingProducts,
      productPerformance,
      categoryPerformance,
      inventoryStatus,
      revenueByProduct,
      productTrends
    ] = await Promise.all([
      // Best selling products by quantity
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.price,
          p.sku,
          pc.name as category_name,
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.price) as total_revenue,
          COUNT(DISTINCT o.id) as order_count,
          AVG(oi.price) as avg_selling_price
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.productId
        LEFT JOIN orders o ON oi.orderId = o.id
        LEFT JOIN product_categories pc ON p.categoryId = pc.id
        WHERE o.paymentStatus = 'PAID' 
        AND o.createdAt >= ${daysAgo}
        ${category ? `AND pc.id = '${category}'` : ''}
        GROUP BY p.id, p.name, p.price, p.sku, pc.name
        ORDER BY total_sold DESC
        LIMIT 20
      `,

      // Product performance metrics
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT p.id) as total_products,
          COUNT(DISTINCT CASE WHEN oi.id IS NOT NULL THEN p.id END) as products_sold,
          AVG(p.price) as avg_product_price,
          SUM(CASE WHEN p.quantity <= p.minQuantity THEN 1 ELSE 0 END) as low_stock_products,
          SUM(CASE WHEN p.quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_products
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.productId
        LEFT JOIN orders o ON oi.orderId = o.id AND o.paymentStatus = 'PAID' AND o.createdAt >= ${daysAgo}
      `,

      // Category performance
      prisma.$queryRaw`
        SELECT 
          pc.id,
          pc.name,
          COUNT(DISTINCT p.id) as product_count,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
          COUNT(DISTINCT o.id) as order_count
        FROM product_categories pc
        LEFT JOIN products p ON pc.id = p.categoryId
        LEFT JOIN order_items oi ON p.id = oi.productId
        LEFT JOIN orders o ON oi.orderId = o.id AND o.paymentStatus = 'PAID' AND o.createdAt >= ${daysAgo}
        GROUP BY pc.id, pc.name
        ORDER BY total_revenue DESC
      `,

      // Inventory status
      prisma.$queryRaw`
        SELECT 
          status,
          COUNT(*) as product_count,
          AVG(quantity) as avg_quantity
        FROM (
          SELECT 
            p.*,
            CASE 
              WHEN p.quantity = 0 THEN 'Out of Stock'
              WHEN p.quantity <= p.minQuantity THEN 'Low Stock'
              WHEN p.quantity > (p.minQuantity * 3) THEN 'Overstocked'
              ELSE 'Normal'
            END as status
          FROM products p
        ) inventory_status
        GROUP BY status
      `,

      // Revenue contribution by product
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          SUM(oi.quantity * oi.price) as revenue,
          (SUM(oi.quantity * oi.price) * 100.0 / (
            SELECT SUM(oi2.quantity * oi2.price) 
            FROM order_items oi2 
            JOIN orders o2 ON oi2.orderId = o2.id 
            WHERE o2.paymentStatus = 'PAID' AND o2.createdAt >= ${daysAgo}
          )) as revenue_percentage
        FROM products p
        JOIN order_items oi ON p.id = oi.productId
        JOIN orders o ON oi.orderId = o.id
        WHERE o.paymentStatus = 'PAID' AND o.createdAt >= ${daysAgo}
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 10
      `,

      // Product sales trends over time
      prisma.$queryRaw`
        SELECT 
          DATE(o.createdAt) as date,
          COUNT(DISTINCT oi.productId) as products_sold,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.quantity * oi.price) as total_revenue
        FROM orders o
        JOIN order_items oi ON o.id = oi.orderId
        WHERE o.paymentStatus = 'PAID' AND o.createdAt >= ${daysAgo}
        GROUP BY DATE(o.createdAt)
        ORDER BY date ASC
      `
    ]);

    // Calculate conversion rates and other metrics
    const totalProducts = productPerformance[0]?.total_products || 0;
    const productsSold = productPerformance[0]?.products_sold || 0;
    const sellThroughRate = totalProducts > 0 ? (productsSold / totalProducts) * 100 : 0;

    const productReport = {
      summary: {
        totalProducts,
        productsSold,
        sellThroughRate: Math.round(sellThroughRate * 100) / 100,
        averageProductPrice: productPerformance[0]?.avg_product_price || 0,
        lowStockProducts: productPerformance[0]?.low_stock_products || 0,
        outOfStockProducts: productPerformance[0]?.out_of_stock_products || 0
      },
      bestSellers: bestSellingProducts,
      categoryPerformance,
      inventoryStatus,
      revenueContribution: revenueByProduct,
      salesTrends: productTrends,
      period: parseInt(period)
    };

    return NextResponse.json(productReport);
  } catch (error) {
    console.error('Error generating product report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
