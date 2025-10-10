import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get comprehensive platform analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const dateRange = getDateRange(timeframe)

    // Get comprehensive analytics in parallel
    const [
      userAnalytics,
      financialAnalytics,
      taskAnalytics,
      blogAnalytics,
      productAnalytics,
      orderAnalytics,
      mlmAnalytics,
      systemHealth
    ] = await Promise.all([
      getUserAnalytics(dateRange),
      getFinancialAnalytics(dateRange),
      getTaskAnalytics(dateRange),
      getBlogAnalytics(dateRange),
      getProductAnalytics(dateRange),
      getOrderAnalytics(dateRange),
      getMlmAnalytics(dateRange),
      getSystemHealth()
    ])

    // Calculate growth metrics
    const previousPeriod = getPreviousDateRange(timeframe)
    const growthMetrics = await getGrowthMetrics(dateRange, previousPeriod)

    // Real-time metrics
    const realtimeMetrics = await getRealtimeMetrics()

    // Convert BigInt values to regular numbers for JSON serialization
    const serializedData = JSON.parse(JSON.stringify({
      timeframe,
      dateRange,
      userAnalytics,
      financialAnalytics,
      taskAnalytics,
      blogAnalytics,
      productAnalytics,
      orderAnalytics,
      mlmAnalytics,
      systemHealth,
      growthMetrics,
      realtimeMetrics,
      generatedAt: new Date().toISOString()
    }, (key, value) => typeof value === 'bigint' ? Number(value) : value))

    return NextResponse.json(serializedData)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
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

function getPreviousDateRange(timeframe: string) {
  const now = new Date()
  const start = new Date()
  const end = new Date()
  
  switch (timeframe) {
    case '7d':
      start.setDate(now.getDate() - 14)
      end.setDate(now.getDate() - 7)
      break
    case '30d':
      start.setDate(now.getDate() - 60)
      end.setDate(now.getDate() - 30)
      break
    case '90d':
      start.setDate(now.getDate() - 180)
      end.setDate(now.getDate() - 90)
      break
    case '1y':
      start.setFullYear(now.getFullYear() - 2)
      end.setFullYear(now.getFullYear() - 1)
      break
    default:
      start.setDate(now.getDate() - 60)
      end.setDate(now.getDate() - 30)
  }
  
  return { start, end }
}

async function getUserAnalytics(dateRange: { start: Date; end: Date }) {
  const [
    totalUsers,
    newUsers,
    activeUsers,
    usersByRole,
    userGrowth,
    topUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.user.count({
      where: {
        isActive: true,
        updatedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    }),
    getUserGrowthData(dateRange),
    prisma.user.findMany({
      take: 10,
      orderBy: [
        { totalEarnings: 'desc' },
        { tasksCompleted: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        totalEarnings: true,
        tasksCompleted: true,
        totalPoints: true,
        createdAt: true
      }
    })
  ])

  return {
    totalUsers,
    newUsers,
    activeUsers,
    usersByRole,
    userGrowth,
    topUsers,
    retentionRate: activeUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
  }
}

async function getFinancialAnalytics(dateRange: { start: Date; end: Date }) {
  const [
    totalRevenue,
    totalCommissions,
    totalPayouts,
    revenueGrowth,
    commissionDistribution,
    topEarners
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        },
        paymentStatus: 'COMPLETED'
      },
      _sum: { totalPkr: true }
    }),
    prisma.user.aggregate({
      _sum: { totalEarnings: true }
    }),
    prisma.user.aggregate({
      _sum: { pendingCommission: true }
    }),
    getRevenueGrowthData(dateRange),
    getCommissionDistributionData(dateRange),
    prisma.user.findMany({
      take: 10,
      orderBy: { totalEarnings: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        totalEarnings: true,
        pendingCommission: true,
        balance: true
      }
    })
  ])

  return {
    totalRevenue: totalRevenue._sum.totalPkr || 0,
    totalCommissions: totalCommissions._sum.totalEarnings || 0,
    totalPayouts: totalPayouts._sum.pendingCommission || 0,
    revenueGrowth,
    commissionDistribution,
    topEarners,
    averageOrderValue: totalRevenue._sum.totalPkr || 0 / Math.max(1, await prisma.order.count({ where: { createdAt: { gte: dateRange.start, lte: dateRange.end } } }))
  }
}

async function getTaskAnalytics(dateRange: { start: Date; end: Date }) {
  const [
    totalTasks,
    completedTasks,
    totalCompletions,
    tasksByCategory,
    tasksByDifficulty,
    topTasks,
    rewardsPaid
  ] = await Promise.all([
    prisma.task.count(),
    prisma.taskCompletion.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.taskCompletion.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.task.groupBy({
      by: ['category'],
      _count: { id: true }
    }),
    prisma.task.groupBy({
      by: ['difficulty'],
      _count: { id: true }
    }),
    prisma.task.findMany({
      take: 10,
      orderBy: { completions: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        reward: true,
        completions: true,
        attempts: true
      }
    }),
    prisma.taskCompletion.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _sum: { reward: true }
    })
  ])

  return {
    totalTasks,
    completedTasks,
    totalCompletions,
    tasksByCategory,
    tasksByDifficulty,
    topTasks,
    rewardsPaid: rewardsPaid._sum.reward || 0,
    completionRate: totalCompletions > 0 ? (completedTasks / totalCompletions) * 100 : 0
  }
}

async function getBlogAnalytics(dateRange: { start: Date; end: Date }) {
  const [
    totalPosts,
    publishedPosts,
    totalViews,
    totalLikes,
    totalComments,
    topPosts,
    recentPosts
  ] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.count({
      where: { status: 'PUBLISHED' }
    }),
    prisma.blogPost.aggregate({
      _sum: { views: true }
    }),
    prisma.blogPost.aggregate({
      _sum: { likes: true }
    }),
    prisma.blogComment.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.blogPost.findMany({
      take: 10,
      orderBy: { views: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        likes: true,
        shares: true,
        publishedAt: true
      }
    }),
    prisma.blogPost.findMany({
      take: 5,
      orderBy: { publishedAt: 'desc' },
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true
      }
    })
  ])

  return {
    totalPosts,
    publishedPosts,
    totalViews: totalViews._sum.views || 0,
    totalLikes: totalLikes._sum.likes || 0,
    totalComments,
    topPosts,
    recentPosts,
    averageViewsPerPost: (totalViews._sum.views || 0) / Math.max(1, publishedPosts)
  }
}

async function getProductAnalytics(dateRange: { start: Date; end: Date }) {
  const [
    totalProducts,
    activeProducts,
    totalSales,
    lowStockProducts,
    topProducts,
    categoryPerformance
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: { status: 'ACTIVE' }
    }),
    prisma.product.aggregate({
      _sum: { sales: true }
    }),
    prisma.product.findMany({
      where: {
        trackQuantity: true,
        quantity: { lte: 10 }
      },
      take: 10,
      select: {
        id: true,
        name: true,
        quantity: true,
        minQuantity: true
      }
    }),
    prisma.product.findMany({
      take: 10,
      orderBy: { sales: 'desc' },
      select: {
        id: true,
        name: true,
        price: true,
        sales: true,
        views: true,
        rating: true
      }
    }),
    prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      _sum: { sales: true }
    })
  ])

  return {
    totalProducts,
    activeProducts,
    totalSales: totalSales._sum.sales || 0,
    lowStockProducts,
    topProducts,
    categoryPerformance,
    lowStockCount: lowStockProducts.length
  }
}

async function getOrderAnalytics(dateRange: { start: Date; end: Date }) {
  const [
    totalOrders,
    completedOrders,
    pendingOrders,
    totalRevenue,
    ordersByStatus,
    recentOrders
  ] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.order.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.order.count({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _sum: { totalPkr: true }
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalPkr: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
  ])

  return {
    totalOrders,
    completedOrders,
    pendingOrders,
    totalRevenue: totalRevenue._sum.totalPkr || 0,
    ordersByStatus,
    recentOrders,
    averageOrderValue: (totalRevenue._sum.totalPkr || 0) / Math.max(1, totalOrders)
  }
}

async function getMlmAnalytics(dateRange: { start: Date; end: Date }) {
  const [
    totalNetwork,
    activeSponsors,
    totalCommissions,
    networkGrowth,
    topSponsors,
    commissionLevels
  ] = await Promise.all([
    prisma.user.count({
      where: { sponsorId: { not: null } }
    }),
    prisma.user.count({
      where: {
        sponsorId: { not: null },
        isActive: true
      }
    }),
    prisma.user.aggregate({
      _sum: { pendingCommission: true }
    }),
    getNetworkGrowthData(dateRange),
    prisma.user.findMany({
      take: 10,
      orderBy: { pendingCommission: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        pendingCommission: true,
        totalEarnings: true
      }
    }),
    getCommissionLevelData()
  ])

  return {
    totalNetwork,
    activeSponsors,
    totalCommissions: totalCommissions._sum.pendingCommission || 0,
    networkGrowth,
    topSponsors,
    commissionLevels,
    networkActivityRate: activeSponsors > 0 ? (activeSponsors / totalNetwork) * 100 : 0
  }
}

async function getSystemHealth() {
  const [
    dbSize,
    totalUsers,
    totalOrders,
    totalTasks,
    totalPosts,
    totalProducts
  ] = await Promise.all([
    prisma.$queryRaw`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`,
    prisma.user.count(),
    prisma.order.count(),
    prisma.task.count(),
    prisma.blogPost.count(),
    prisma.product.count()
  ])

  return {
    dbSize: Array.isArray(dbSize) && dbSize[0] ? (dbSize[0] as any).size : 0,
    totalRecords: totalUsers + totalOrders + totalTasks + totalPosts + totalProducts,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    healthScore: 95 // Placeholder - could be calculated based on various factors
  }
}

async function getGrowthMetrics(current: { start: Date; end: Date }, previous: { start: Date; end: Date }) {
  const [currentUsers, previousUsers] = await Promise.all([
    prisma.user.count({
      where: {
        createdAt: {
          gte: current.start,
          lte: current.end
        }
      }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: previous.start,
          lte: previous.end
        }
      }
    })
  ])

  const userGrowth = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0

  return {
    userGrowth,
    // Add more growth metrics as needed
  }
}

async function getRealtimeMetrics() {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const [
    recentUsers,
    recentOrders,
    recentTasks,
    activeUsers
  ] = await Promise.all([
    prisma.user.count({
      where: {
        createdAt: { gte: hourAgo }
      }
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: hourAgo }
      }
    }),
    prisma.taskCompletion.count({
      where: {
        createdAt: { gte: hourAgo }
      }
    }),
    prisma.user.count({
      where: {
        updatedAt: { gte: hourAgo }
      }
    })
  ])

  return {
    recentUsers,
    recentOrders,
    recentTasks,
    activeUsers,
    timestamp: now.toISOString()
  }
}

// Additional helper functions for growth data
async function getUserGrowthData(dateRange: { start: Date; end: Date }) {
  // Implementation for user growth chart data
  return []
}

async function getRevenueGrowthData(dateRange: { start: Date; end: Date }) {
  // Implementation for revenue growth chart data
  return []
}

async function getCommissionDistributionData(dateRange: { start: Date; end: Date }) {
  // Implementation for commission distribution data
  return []
}

async function getNetworkGrowthData(dateRange: { start: Date; end: Date }) {
  // Implementation for network growth data
  return []
}

async function getCommissionLevelData() {
  // Implementation for commission level analysis
  return []
} 