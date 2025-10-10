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
    const stockLevel = searchParams.get('stockLevel');

    // Calculate date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const [
      inventoryOverview,
      stockAlerts,
      inventoryMovement,
      stockTurnover,
      categoryInventory,
      reorderSuggestions,
      inventoryValue
    ] = await Promise.all([
      // Inventory overview
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_products,
          SUM(quantity) as total_stock,
          SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
          SUM(CASE WHEN quantity <= minQuantity AND quantity > 0 THEN 1 ELSE 0 END) as low_stock,
          SUM(CASE WHEN quantity > (minQuantity * 3) THEN 1 ELSE 0 END) as overstocked,
          AVG(quantity) as avg_stock_level
        FROM products
        WHERE trackQuantity = true
      `,

      // Stock alerts by category
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.quantity,
          p.minQuantity,
          pc.name as category_name,
          CASE 
            WHEN p.quantity = 0 THEN 'Out of Stock'
            WHEN p.quantity <= p.minQuantity THEN 'Low Stock'
            WHEN p.quantity > (p.minQuantity * 3) THEN 'Overstocked'
            ELSE 'Normal'
          END as stock_status,
          (p.quantity * p.price) as inventory_value
        FROM products p
        LEFT JOIN product_categories pc ON p.categoryId = pc.id
        WHERE p.trackQuantity = true
        ${stockLevel ? `AND (
          CASE 
            WHEN '${stockLevel}' = 'out_of_stock' THEN p.quantity = 0
            WHEN '${stockLevel}' = 'low_stock' THEN p.quantity <= p.minQuantity AND p.quantity > 0
            WHEN '${stockLevel}' = 'overstocked' THEN p.quantity > (p.minQuantity * 3)
            ELSE true
          END
        )` : ''}
        ORDER BY 
          CASE 
            WHEN p.quantity = 0 THEN 1
            WHEN p.quantity <= p.minQuantity THEN 2
            WHEN p.quantity > (p.minQuantity * 3) THEN 3
            ELSE 4
          END,
          p.quantity ASC
      `,

      // Inventory movement (sales in period)
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.quantity as current_stock,
          COALESCE(SUM(oi.quantity), 0) as sold_quantity,
          COALESCE(AVG(oi.quantity), 0) as avg_daily_sales,
          CASE 
            WHEN COALESCE(AVG(oi.quantity), 0) > 0 
            THEN p.quantity / COALESCE(AVG(oi.quantity), 0)
            ELSE 999
          END as days_of_stock
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.productId
        LEFT JOIN orders o ON oi.orderId = o.id AND o.paymentStatus = 'PAID' AND o.createdAt >= ${daysAgo}
        WHERE p.trackQuantity = true
        GROUP BY p.id, p.name, p.sku, p.quantity
        ORDER BY sold_quantity DESC
        LIMIT 50
      `,

      // Stock turnover analysis
      prisma.$queryRaw`
        SELECT 
          pc.name as category,
          COUNT(p.id) as product_count,
          AVG(p.quantity) as avg_stock,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          CASE 
            WHEN AVG(p.quantity) > 0 
            THEN COALESCE(SUM(oi.quantity), 0) / AVG(p.quantity)
            ELSE 0
          END as turnover_ratio
        FROM product_categories pc
        LEFT JOIN products p ON pc.id = p.categoryId AND p.trackQuantity = true
        LEFT JOIN order_items oi ON p.id = oi.productId
        LEFT JOIN orders o ON oi.orderId = o.id AND o.paymentStatus = 'PAID' AND o.createdAt >= ${daysAgo}
        GROUP BY pc.id, pc.name
        ORDER BY turnover_ratio DESC
      `,

      // Category-wise inventory
      prisma.$queryRaw`
        SELECT 
          pc.name as category,
          COUNT(p.id) as product_count,
          SUM(p.quantity) as total_stock,
          SUM(p.quantity * p.price) as inventory_value,
          SUM(CASE WHEN p.quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
          SUM(CASE WHEN p.quantity <= p.minQuantity AND p.quantity > 0 THEN 1 ELSE 0 END) as low_stock_count
        FROM product_categories pc
        LEFT JOIN products p ON pc.id = p.categoryId AND p.trackQuantity = true
        GROUP BY pc.id, pc.name
        ORDER BY inventory_value DESC
      `,

      // Reorder suggestions
      prisma.$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.quantity,
          p.minQuantity,
          COALESCE(AVG(oi.quantity), 0) as avg_daily_sales,
          CASE 
            WHEN COALESCE(AVG(oi.quantity), 0) > 0 
            THEN GREATEST(p.minQuantity * 2, COALESCE(AVG(oi.quantity), 0) * 30)
            ELSE p.minQuantity * 2
          END as suggested_reorder_quantity,
          pc.name as category_name
        FROM products p
        LEFT JOIN product_categories pc ON p.categoryId = pc.id
        LEFT JOIN order_items oi ON p.id = oi.productId
        LEFT JOIN orders o ON oi.orderId = o.id AND o.paymentStatus = 'PAID' AND o.createdAt >= ${daysAgo}
        WHERE p.trackQuantity = true 
        AND (p.quantity <= p.minQuantity OR p.quantity = 0)
        GROUP BY p.id, p.name, p.sku, p.quantity, p.minQuantity, pc.name
        ORDER BY 
          CASE WHEN p.quantity = 0 THEN 1 ELSE 2 END,
          avg_daily_sales DESC
      `,

      // Total inventory value
      prisma.$queryRaw`
        SELECT 
          SUM(quantity * price) as total_inventory_value,
          SUM(quantity * costPrice) as total_cost_value,
          COUNT(*) as valued_products
        FROM products 
        WHERE trackQuantity = true AND price > 0
      `
    ]);

    const inventoryReport = {
      overview: {
        totalProducts: inventoryOverview[0]?.total_products || 0,
        totalStock: inventoryOverview[0]?.total_stock || 0,
        outOfStock: inventoryOverview[0]?.out_of_stock || 0,
        lowStock: inventoryOverview[0]?.low_stock || 0,
        overstocked: inventoryOverview[0]?.overstocked || 0,
        averageStockLevel: inventoryOverview[0]?.avg_stock_level || 0,
        totalInventoryValue: inventoryValue[0]?.total_inventory_value || 0,
        totalCostValue: inventoryValue[0]?.total_cost_value || 0
      },
      stockAlerts,
      inventoryMovement,
      stockTurnover,
      categoryInventory,
      reorderSuggestions,
      period: parseInt(period)
    };

    return NextResponse.json(inventoryReport);
  } catch (error) {
    console.error('Error generating inventory report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
