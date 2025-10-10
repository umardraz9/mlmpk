import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get comprehensive product analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const category = searchParams.get('category') || 'all'
    const dateRange = getDateRange(timeframe)

    // Get comprehensive product analytics in parallel
    const [
      salesOverview,
      inventoryAnalytics,
      productPerformance,
      revenueAnalysis,
      categoryAnalysis,
      customerInsights,
      trendingProducts,
      conversionMetrics
    ] = await Promise.all([
      getSalesOverview(dateRange, category),
      getInventoryAnalytics(category),
      getProductPerformance(dateRange, category),
      getRevenueAnalysis(dateRange, category),
      getCategoryAnalysis(dateRange),
      getCustomerInsights(dateRange, category),
      getTrendingProducts(dateRange),
      getConversionMetrics(dateRange, category)
    ])

    return NextResponse.json({
      timeframe,
      category,
      dateRange,
      salesOverview,
      inventoryAnalytics,
      productPerformance,
      revenueAnalysis,
      categoryAnalysis,
      customerInsights,
      trendingProducts,
      conversionMetrics,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching product analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get date range
function getDateRange(timeframe: string) {
  const now = new Date()
  const start = new Date()
  
  switch (timeframe) {
    case '7d':
      start.setDate(now.getDate() - 7)
      break
    case '30d':
      start.setDate(now.getDate() - 30)
      break
    case '90d':
      start.setDate(now.getDate() - 90)
      break
    case '1y':
      start.setFullYear(now.getFullYear() - 1)
      break
    default:
      start.setDate(now.getDate() - 30)
  }
  
  return { start, end: now }
}

// Sales Overview Analytics
async function getSalesOverview(dateRange: { start: Date; end: Date }, category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const [
    totalProducts,
    activeProducts,
    totalSales,
    totalRevenue,
    averageOrderValue,
    salesGrowth,
    topSellingProducts
  ] = await Promise.all([
    prisma.product.count({
      where: categoryFilter
    }),
    prisma.product.count({
      where: { 
        status: 'ACTIVE',
        ...categoryFilter
      }
    }),
    getTotalSales(dateRange, category),
    getTotalRevenue(dateRange, category),
    getAverageOrderValue(dateRange, category),
    getSalesGrowth(dateRange, category),
    getTopSellingProducts(dateRange, category)
  ])

  return {
    totalProducts,
    activeProducts,
    totalSales,
    totalRevenue,
    averageOrderValue,
    salesGrowth,
    topSellingProducts
  }
}

// Inventory Analytics
async function getInventoryAnalytics(category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const [
    totalInventoryValue,
    lowStockProducts,
    outOfStockProducts,
    inventoryTurnover,
    stockLevels,
    inventoryByCategory
  ] = await Promise.all([
    getTotalInventoryValue(category),
    getLowStockProducts(category),
    getOutOfStockProducts(category),
    getInventoryTurnover(category),
    getStockLevels(category),
    getInventoryByCategory()
  ])

  return {
    totalInventoryValue,
    lowStockProducts,
    outOfStockProducts,
    inventoryTurnover,
    stockLevels,
    inventoryByCategory
  }
}

// Product Performance Analytics
async function getProductPerformance(dateRange: { start: Date; end: Date }, category: string) {
  const [
    performanceMetrics,
    salesTrends,
    productRankings,
    viewsToSalesConversion,
    customerFavorites,
    seasonalTrends
  ] = await Promise.all([
    getPerformanceMetrics(dateRange, category),
    getSalesTrends(dateRange, category),
    getProductRankings(dateRange, category),
    getViewsToSalesConversion(dateRange, category),
    getCustomerFavorites(dateRange, category),
    getSeasonalTrends(dateRange, category)
  ])

  return {
    performanceMetrics,
    salesTrends,
    productRankings,
    viewsToSalesConversion,
    customerFavorites,
    seasonalTrends
  }
}

// Revenue Analysis
async function getRevenueAnalysis(dateRange: { start: Date; end: Date }, category: string) {
  const [
    revenueBreakdown,
    profitMargins,
    revenueByCategory,
    revenueGrowth,
    forecastData
  ] = await Promise.all([
    getRevenueBreakdown(dateRange, category),
    getProfitMargins(dateRange, category),
    getRevenueByCategory(dateRange),
    getRevenueGrowth(dateRange, category),
    getRevenueForecast(dateRange, category)
  ])

  return {
    revenueBreakdown,
    profitMargins,
    revenueByCategory,
    revenueGrowth,
    forecastData
  }
}

// Category Analysis
async function getCategoryAnalysis(dateRange: { start: Date; end: Date }) {
  const [
    categoryPerformance,
    categoryTrends,
    categoryComparison,
    marketShare
  ] = await Promise.all([
    getCategoryPerformance(dateRange),
    getCategoryTrends(dateRange),
    getCategoryComparison(dateRange),
    getCategoryMarketShare(dateRange)
  ])

  return {
    categoryPerformance,
    categoryTrends,
    categoryComparison,
    marketShare
  }
}

// Customer Insights
async function getCustomerInsights(dateRange: { start: Date; end: Date }, category: string) {
  const [
    customerBehavior,
    purchasePatterns,
    customerSegments,
    loyaltyMetrics
  ] = await Promise.all([
    getCustomerBehavior(dateRange, category),
    getPurchasePatterns(dateRange, category),
    getCustomerSegments(dateRange, category),
    getLoyaltyMetrics(dateRange, category)
  ])

  return {
    customerBehavior,
    purchasePatterns,
    customerSegments,
    loyaltyMetrics
  }
}

// Trending Products
async function getTrendingProducts(dateRange: { start: Date; end: Date }) {
  const [
    hotProducts,
    risingStars,
    decliningProducts,
    newProducts
  ] = await Promise.all([
    getHotProducts(dateRange),
    getRisingStars(dateRange),
    getDecliningProducts(dateRange),
    getNewProducts(dateRange)
  ])

  return {
    hotProducts,
    risingStars,
    decliningProducts,
    newProducts
  }
}

// Conversion Metrics
async function getConversionMetrics(dateRange: { start: Date; end: Date }, category: string) {
  const [
    conversionRates,
    abandonmentAnalysis,
    optimizationOpportunities
  ] = await Promise.all([
    getConversionRates(dateRange, category),
    getAbandonmentAnalysis(dateRange, category),
    getOptimizationOpportunities(dateRange, category)
  ])

  return {
    conversionRates,
    abandonmentAnalysis,
    optimizationOpportunities
  }
}

// Implementation of helper functions
async function getTotalSales(dateRange: { start: Date; end: Date }, category: string) {
  // Parse order items to count product sales
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: dateRange.start, lte: dateRange.end },
      status: { in: ['DELIVERED', 'PROCESSING', 'SHIPPED'] }
    },
    select: { items: true }
  })

  let totalSales = 0
  orders.forEach(order => {
    try {
      const items = JSON.parse(order.items)
      items.forEach((item: any) => {
        if (category === 'all' || item.category === category) {
          totalSales += item.quantity || 1
        }
      })
    } catch (e) {
      // Handle invalid JSON
    }
  })

  return totalSales
}

async function getTotalRevenue(dateRange: { start: Date; end: Date }, category: string) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: dateRange.start, lte: dateRange.end },
      status: { in: ['DELIVERED', 'PROCESSING', 'SHIPPED'] }
    },
    select: { items: true, totalPkr: true }
  })

  let totalRevenue = 0
  if (category === 'all') {
    totalRevenue = orders.reduce((sum, order) => sum + order.totalPkr, 0)
  } else {
    orders.forEach(order => {
      try {
        const items = JSON.parse(order.items)
        items.forEach((item: any) => {
          if (item.category === category) {
            totalRevenue += (item.price || 0) * (item.quantity || 1)
          }
        })
      } catch (e) {
        // Handle invalid JSON
      }
    })
  }

  return totalRevenue
}

async function getAverageOrderValue(dateRange: { start: Date; end: Date }, category: string) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: dateRange.start, lte: dateRange.end },
      status: { in: ['DELIVERED', 'PROCESSING', 'SHIPPED'] }
    },
    select: { totalPkr: true }
  })

  if (orders.length === 0) return 0
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPkr, 0)
  return totalRevenue / orders.length
}

async function getSalesGrowth(dateRange: { start: Date; end: Date }, category: string) {
  const previousPeriod = {
    start: new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime())),
    end: dateRange.start
  }

  const [currentSales, previousSales] = await Promise.all([
    getTotalSales(dateRange, category),
    getTotalSales(previousPeriod, category)
  ])

  if (previousSales === 0) return 0
  return ((currentSales - previousSales) / previousSales) * 100
}

async function getTopSellingProducts(dateRange: { start: Date; end: Date }, category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...categoryFilter
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      sales: true,
      views: true,
      rating: true,
      reviewCount: true,
      category: true,
      images: true
    },
    orderBy: { sales: 'desc' },
    take: 10
  })
}

async function getTotalInventoryValue(category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      trackQuantity: true,
      ...categoryFilter
    },
    select: {
      quantity: true,
      costPrice: true,
      price: true
    }
  })

  return products.reduce((total, product) => {
    const value = (product.costPrice || product.price) * product.quantity
    return total + value
  }, 0)
}

async function getLowStockProducts(category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      trackQuantity: true,
      ...categoryFilter,
      AND: [
        { quantity: { gt: 0 } },
        { 
          OR: [
            { quantity: { lte: 10 } } // Products with low stock
          ]
        }
      ]
    },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      minQuantity: true,
      category: true,
      price: true
    },
    orderBy: { quantity: 'asc' },
    take: 20
  })
}

async function getOutOfStockProducts(category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      trackQuantity: true,
      quantity: 0,
      ...categoryFilter
    },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      price: true,
      sales: true,
      updatedAt: true
    },
    orderBy: { sales: 'desc' },
    take: 20
  })
}

async function getInventoryTurnover(category: string) {
  // Simplified calculation - would need more sophisticated logic in production
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...categoryFilter
    },
    select: {
      sales: true,
      quantity: true
    }
  })

  if (products.length === 0) return 0

  const totalSales = products.reduce((sum, p) => sum + p.sales, 0)
  const avgInventory = products.reduce((sum, p) => sum + p.quantity, 0) / products.length
  
  return avgInventory > 0 ? totalSales / avgInventory : 0
}

async function getStockLevels(category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const stockData = await prisma.$queryRaw<{ level: string; count: number }[]>`
    SELECT 
      CASE 
        WHEN quantity = 0 THEN 'Out of Stock'
        WHEN quantity <= minQuantity OR quantity <= 10 THEN 'Low Stock'
        WHEN quantity <= 50 THEN 'Medium Stock'
        ELSE 'High Stock'
      END as level,
      COUNT(*) as count
    FROM products
    WHERE status = 'ACTIVE' AND trackQuantity = 1
    ${category !== 'all' ? prisma.$queryRaw`AND category = ${category}` : prisma.$queryRaw``}
    GROUP BY level
  `
  
  return stockData
}

async function getInventoryByCategory() {
  const categoryData = await prisma.$queryRaw<{ category: string; total_value: number; product_count: number }[]>`
    SELECT 
      category,
      SUM(quantity * COALESCE(costPrice, price)) as total_value,
      COUNT(*) as product_count
    FROM products
    WHERE status = 'ACTIVE' AND trackQuantity = 1 AND category IS NOT NULL
    GROUP BY category
    ORDER BY total_value DESC
  `
  
  return categoryData
}

async function getPerformanceMetrics(dateRange: { start: Date; end: Date }, category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const metrics = await prisma.product.aggregate({
    where: {
      status: 'ACTIVE',
      ...categoryFilter
    },
    _avg: {
      rating: true,
      sales: true,
      views: true,
      price: true
    },
    _sum: {
      sales: true,
      views: true,
      reviewCount: true
    },
    _count: true
  })

  return {
    averageRating: metrics._avg.rating || 0,
    averageSales: metrics._avg.sales || 0,
    averageViews: metrics._avg.views || 0,
    averagePrice: metrics._avg.price || 0,
    totalSales: metrics._sum.sales || 0,
    totalViews: metrics._sum.views || 0,
    totalReviews: metrics._sum.reviewCount || 0,
    productCount: metrics._count
  }
}

async function getSalesTrends(dateRange: { start: Date; end: Date }, category: string) {
  // Mock sales trends data - would need order history analysis
  const trends = []
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
  
  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000)
    trends.push({
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 5000) + 1000
    })
  }
  
  return trends
}

async function getProductRankings(dateRange: { start: Date; end: Date }, category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      ...categoryFilter
    },
    select: {
      id: true,
      name: true,
      sales: true,
      views: true,
      rating: true,
      reviewCount: true,
      price: true,
      category: true
    },
    orderBy: [
      { sales: 'desc' },
      { views: 'desc' },
      { rating: 'desc' }
    ],
    take: 20
  })
}

async function getViewsToSalesConversion(dateRange: { start: Date; end: Date }, category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      views: { gt: 0 },
      ...categoryFilter
    },
    select: {
      id: true,
      name: true,
      views: true,
      sales: true,
      category: true
    }
  })

  return products.map(product => ({
    ...product,
    conversionRate: product.views > 0 ? (product.sales / product.views) * 100 : 0
  })).sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 15)
}

async function getCustomerFavorites(dateRange: { start: Date; end: Date }, category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      rating: { gte: 4.0 },
      reviewCount: { gte: 5 },
      ...categoryFilter
    },
    select: {
      id: true,
      name: true,
      rating: true,
      reviewCount: true,
      sales: true,
      price: true,
      category: true,
      images: true
    },
    orderBy: [
      { rating: 'desc' },
      { reviewCount: 'desc' }
    ],
    take: 10
  })
}

async function getSeasonalTrends(dateRange: { start: Date; end: Date }, category: string) {
  // Mock seasonal data - would need historical analysis
  return [
    { month: 'Jan', sales: Math.floor(Math.random() * 100) + 50 },
    { month: 'Feb', sales: Math.floor(Math.random() * 100) + 50 },
    { month: 'Mar', sales: Math.floor(Math.random() * 100) + 50 },
    { month: 'Apr', sales: Math.floor(Math.random() * 100) + 50 },
    { month: 'May', sales: Math.floor(Math.random() * 100) + 50 },
    { month: 'Jun', sales: Math.floor(Math.random() * 100) + 50 }
  ]
}

async function getRevenueBreakdown(dateRange: { start: Date; end: Date }, category: string) {
  const totalRevenue = await getTotalRevenue(dateRange, category)
  
  // Simplified breakdown - would need more detailed order analysis
  return {
    gross_revenue: totalRevenue,
    discounts: totalRevenue * 0.1,
    shipping: totalRevenue * 0.05,
    taxes: totalRevenue * 0.17, // Pakistani GST
    net_revenue: totalRevenue * 0.68
  }
}

async function getProfitMargins(dateRange: { start: Date; end: Date }, category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      costPrice: { not: null },
      ...categoryFilter
    },
    select: {
      name: true,
      price: true,
      costPrice: true,
      sales: true,
      category: true
    }
  })

  return products.map(product => ({
    ...product,
    margin: product.costPrice ? ((product.price - product.costPrice) / product.price) * 100 : 0,
    profit: product.costPrice ? (product.price - product.costPrice) * product.sales : 0
  })).sort((a, b) => b.margin - a.margin).slice(0, 15)
}

async function getRevenueByCategory(dateRange: { start: Date; end: Date }) {
  const categoryRevenue = await prisma.$queryRaw<{ category: string; revenue: number; sales: number }[]>`
    SELECT 
      COALESCE(category, 'Uncategorized') as category,
      SUM(price * sales) as revenue,
      SUM(sales) as sales
    FROM products
    WHERE status = 'ACTIVE'
    GROUP BY category
    ORDER BY revenue DESC
  `
  
  return categoryRevenue
}

async function getRevenueGrowth(dateRange: { start: Date; end: Date }, category: string) {
  const previousPeriod = {
    start: new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime())),
    end: dateRange.start
  }

  const [currentRevenue, previousRevenue] = await Promise.all([
    getTotalRevenue(dateRange, category),
    getTotalRevenue(previousPeriod, category)
  ])

  if (previousRevenue === 0) return 0
  return ((currentRevenue - previousRevenue) / previousRevenue) * 100
}

async function getRevenueForecast(dateRange: { start: Date; end: Date }, category: string) {
  const currentRevenue = await getTotalRevenue(dateRange, category)
  const growthRate = await getRevenueGrowth(dateRange, category)
  
  const forecast = []
  for (let i = 1; i <= 6; i++) {
    const projectedRevenue = currentRevenue * Math.pow(1 + (growthRate / 100), i)
    forecast.push({
      month: i,
      projected_revenue: Math.round(projectedRevenue),
      confidence: Math.max(90 - (i * 10), 50)
    })
  }
  
  return forecast
}

async function getCategoryPerformance(dateRange: { start: Date; end: Date }) {
  const performance = await prisma.$queryRaw<any[]>`
    SELECT 
      COALESCE(category, 'Uncategorized') as category,
      COUNT(*) as product_count,
      SUM(sales) as total_sales,
      AVG(rating) as avg_rating,
      SUM(views) as total_views,
      AVG(price) as avg_price
    FROM products
    WHERE status = 'ACTIVE'
    GROUP BY category
    ORDER BY total_sales DESC
  `
  
  return performance
}

async function getCategoryTrends(dateRange: { start: Date; end: Date }) {
  // Mock trend data - would need historical analysis
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports']
  return categories.map(category => ({
    category,
    trend: Math.floor(Math.random() * 40) - 20, // -20% to +20%
    sales_change: Math.floor(Math.random() * 100) + 50
  }))
}

async function getCategoryComparison(dateRange: { start: Date; end: Date }) {
  const comparison = await prisma.$queryRaw<any[]>`
    SELECT 
      COALESCE(category, 'Uncategorized') as category,
      COUNT(*) as products,
      SUM(sales) as sales,
      SUM(views) as views,
      AVG(rating) as rating,
      SUM(quantity) as inventory
    FROM products
    WHERE status = 'ACTIVE'
    GROUP BY category
  `
  
  return comparison
}

async function getCategoryMarketShare(dateRange: { start: Date; end: Date }) {
  const marketShare = await prisma.$queryRaw<any[]>`
    SELECT 
      COALESCE(category, 'Uncategorized') as category,
      SUM(sales * price) as revenue,
      COUNT(*) as products
    FROM products
    WHERE status = 'ACTIVE'
    GROUP BY category
  `
  
  const totalRevenue = marketShare.reduce((sum, cat) => sum + (cat.revenue || 0), 0)
  
  return marketShare.map(cat => ({
    ...cat,
    market_share: totalRevenue > 0 ? ((cat.revenue || 0) / totalRevenue) * 100 : 0
  }))
}

async function getCustomerBehavior(dateRange: { start: Date; end: Date }, category: string) {
  // Mock customer behavior data
  return {
    avg_session_duration: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
    bounce_rate: Math.floor(Math.random() * 30) + 40, // 40-70%
    pages_per_session: Math.floor(Math.random() * 5) + 2, // 2-7 pages
    conversion_rate: Math.floor(Math.random() * 5) + 2 // 2-7%
  }
}

async function getPurchasePatterns(dateRange: { start: Date; end: Date }, category: string) {
  // Mock purchase pattern data
  return {
    peak_hours: ['10:00', '14:00', '20:00'],
    peak_days: ['Saturday', 'Sunday', 'Monday'],
    avg_items_per_order: Math.floor(Math.random() * 3) + 2,
    repeat_customer_rate: Math.floor(Math.random() * 30) + 40
  }
}

async function getCustomerSegments(dateRange: { start: Date; end: Date }, category: string) {
  // Mock customer segment data
  return [
    { segment: 'High Value', count: Math.floor(Math.random() * 100) + 50, avg_order: Math.floor(Math.random() * 2000) + 1000 },
    { segment: 'Regular', count: Math.floor(Math.random() * 200) + 100, avg_order: Math.floor(Math.random() * 1000) + 500 },
    { segment: 'Occasional', count: Math.floor(Math.random() * 300) + 150, avg_order: Math.floor(Math.random() * 500) + 200 },
    { segment: 'First Time', count: Math.floor(Math.random() * 150) + 75, avg_order: Math.floor(Math.random() * 400) + 150 }
  ]
}

async function getLoyaltyMetrics(dateRange: { start: Date; end: Date }, category: string) {
  // Mock loyalty metrics
  return {
    customer_retention_rate: Math.floor(Math.random() * 30) + 60,
    avg_customer_lifetime_value: Math.floor(Math.random() * 5000) + 2000,
    repeat_purchase_rate: Math.floor(Math.random() * 25) + 35,
    referral_rate: Math.floor(Math.random() * 15) + 10
  }
}

async function getHotProducts(dateRange: { start: Date; end: Date }) {
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      sales: { gte: 10 },
      views: { gte: 100 }
    },
    select: {
      id: true,
      name: true,
      sales: true,
      views: true,
      price: true,
      rating: true,
      category: true,
      images: true
    },
    orderBy: { sales: 'desc' },
    take: 10
  })
}

async function getRisingStars(dateRange: { start: Date; end: Date }) {
  // Products with high growth potential
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      views: { gte: 50 }
    },
    select: {
      id: true,
      name: true,
      sales: true,
      views: true,
      price: true,
      rating: true,
      category: true,
      createdAt: true
    },
    orderBy: { views: 'desc' },
    take: 10
  })
}

async function getDecliningProducts(dateRange: { start: Date; end: Date }) {
  // Products with declining performance
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      sales: { lte: 5 },
      views: { gte: 100 }
    },
    select: {
      id: true,
      name: true,
      sales: true,
      views: true,
      price: true,
      rating: true,
      category: true,
      updatedAt: true
    },
    orderBy: { sales: 'asc' },
    take: 10
  })
}

async function getNewProducts(dateRange: { start: Date; end: Date }) {
  return await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      createdAt: { gte: dateRange.start }
    },
    select: {
      id: true,
      name: true,
      sales: true,
      views: true,
      price: true,
      rating: true,
      category: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
}

async function getConversionRates(dateRange: { start: Date; end: Date }, category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      views: { gt: 0 },
      ...categoryFilter
    },
    select: {
      views: true,
      sales: true
    }
  })

  const totalViews = products.reduce((sum, p) => sum + p.views, 0)
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0)
  
  return {
    overall_conversion_rate: totalViews > 0 ? (totalSales / totalViews) * 100 : 0,
    views_to_sales: totalViews > 0 ? totalViews / totalSales : 0,
    products_analyzed: products.length
  }
}

async function getAbandonmentAnalysis(dateRange: { start: Date; end: Date }, category: string) {
  // Mock abandonment data - would need cart/session tracking
  return {
    cart_abandonment_rate: Math.floor(Math.random() * 30) + 60,
    browse_abandonment_rate: Math.floor(Math.random() * 20) + 70,
    checkout_abandonment_rate: Math.floor(Math.random() * 15) + 25,
    recovery_opportunities: Math.floor(Math.random() * 100) + 50
  }
}

async function getOptimizationOpportunities(dateRange: { start: Date; end: Date }, category: string) {
  const categoryFilter = category !== 'all' ? { category } : {}
  
  const [
    lowRatingProducts,
    highViewsLowSales,
    priceOptimization
  ] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        rating: { lt: 3.0 },
        reviewCount: { gte: 5 },
        ...categoryFilter
      },
      select: { id: true, name: true, rating: true, reviewCount: true },
      take: 10
    }),
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        views: { gte: 100 },
        sales: { lte: 5 },
        ...categoryFilter
      },
      select: { id: true, name: true, views: true, sales: true },
      take: 10
    }),
    prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        comparePrice: { not: null },
        ...categoryFilter
      },
      select: { id: true, name: true, price: true, comparePrice: true, sales: true },
      orderBy: { sales: 'asc' },
      take: 10
    })
  ])

  return {
    improve_ratings: lowRatingProducts,
    boost_conversions: highViewsLowSales,
    optimize_pricing: priceOptimization
  }
} 