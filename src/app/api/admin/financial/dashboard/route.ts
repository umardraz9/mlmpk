import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Financial dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d' // 7d, 30d, 90d, 1y, all
    
    // Get date range based on timeframe
    const dateRange = getDateRange(timeframe)

    // Get comprehensive financial data
    const [
      revenueData,
      commissionData,
      paymentData,
      userFinancialData,
      monthlyTrends,
      paymentMethodStats,
      topEarners,
      recentTransactions
    ] = await Promise.all([
      getRevenueAnalytics(dateRange),
      getCommissionAnalytics(dateRange),
      getPaymentAnalytics(dateRange),
      getUserFinancialAnalytics(dateRange),
      getMonthlyTrends(dateRange),
      getPaymentMethodStats(dateRange),
      getTopEarners(dateRange),
      getRecentTransactions()
    ])

    return NextResponse.json({
      revenue: revenueData,
      commissions: commissionData,
      payments: paymentData,
      users: userFinancialData,
      trends: monthlyTrends,
      paymentMethods: paymentMethodStats,
      topEarners,
      recentTransactions,
      timeframe
    })
  } catch (error) {
    console.error('Error fetching financial dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get date range
function getDateRange(timeframe: string) {
  const now = new Date()
  let startDate: Date
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(0) // All time
  }
  
  return { startDate, endDate: now }
}

// Revenue Analytics
async function getRevenueAnalytics(dateRange: { startDate: Date, endDate: Date }) {
  const where = {
    createdAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate
    }
  }

  const [
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    voucherRevenue,
    shippingRevenue,
    orderCount,
    averageOrderValue
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalPkr: true },
      where
    }),
    prisma.order.aggregate({
      _sum: { paidAmountPkr: true },
      where: { ...where, paymentStatus: 'PAID' }
    }),
    prisma.order.aggregate({
      _sum: { totalPkr: true },
      where: { ...where, paymentStatus: 'PENDING' }
    }),
    prisma.order.aggregate({
      _sum: { voucherUsedPkr: true },
      where
    }),
    prisma.order.aggregate({
      _sum: { shippingPkr: true },
      where
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      _avg: { totalPkr: true },
      where
    })
  ])

  return {
    totalRevenue: totalRevenue._sum.totalPkr || 0,
    paidRevenue: paidRevenue._sum.paidAmountPkr || 0,
    pendingRevenue: pendingRevenue._sum.totalPkr || 0,
    voucherRevenue: voucherRevenue._sum.voucherUsedPkr || 0,
    shippingRevenue: shippingRevenue._sum.shippingPkr || 0,
    orderCount,
    averageOrderValue: averageOrderValue._avg.totalPkr || 0,
    outstandingAmount: (totalRevenue._sum.totalPkr || 0) - (paidRevenue._sum.paidAmountPkr || 0)
  }
}

// Commission Analytics
async function getCommissionAnalytics(dateRange: { startDate: Date, endDate: Date }) {
  const where = {
    updatedAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate
    }
  }

  const [
    totalCommissions,
    pendingCommissions,
    totalEarnings,
    activeEarners,
    commissionOrders
  ] = await Promise.all([
    prisma.user.aggregate({
      _sum: { totalEarnings: true },
      where
    }),
    prisma.user.aggregate({
      _sum: { pendingCommission: true },
      where
    }),
    prisma.user.aggregate({
      _sum: { totalEarnings: true }
    }),
    prisma.user.count({
      where: { totalEarnings: { gt: 0 } }
    }),
    prisma.order.count({
      where: {
        ...where,
        status: 'COMPLETED'
      }
    })
  ])

  return {
    totalCommissions: totalCommissions._sum.totalEarnings || 0,
    pendingCommissions: pendingCommissions._sum.pendingCommission || 0,
    totalEarnings: totalEarnings._sum.totalEarnings || 0,
    activeEarners,
    commissionOrders,
    averageCommissionPerOrder: commissionOrders > 0 ? (totalCommissions._sum.totalEarnings || 0) / commissionOrders : 0
  }
}

// Payment Analytics
async function getPaymentAnalytics(dateRange: { startDate: Date, endDate: Date }) {
  const where = {
    createdAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate
    }
  }

  const [
    paymentStatusStats,
    paymentMethodStats,
    failedPayments,
    refundedPayments
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ['paymentStatus'],
      _count: { id: true },
      _sum: { totalPkr: true },
      where
    }),
    prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
      _sum: { totalPkr: true },
      where
    }),
    prisma.order.count({
      where: { ...where, paymentStatus: 'FAILED' }
    }),
    prisma.order.aggregate({
      _sum: { paidAmountPkr: true },
      where: { ...where, paymentStatus: 'REFUNDED' }
    })
  ])

  return {
    paymentStatusStats,
    paymentMethodStats,
    failedPayments,
    refundedAmount: refundedPayments._sum.paidAmountPkr || 0,
    successRate: paymentStatusStats.reduce((total, status) => total + (status.paymentStatus === 'PAID' ? status._count.id : 0), 0) / 
                 paymentStatusStats.reduce((total, status) => total + status._count.id, 0) * 100
  }
}

// User Financial Analytics
async function getUserFinancialAnalytics(dateRange: { startDate: Date, endDate: Date }) {
  const where = {
    updatedAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate
    }
  }

  const [
    totalUserBalance,
    totalVoucherBalance,
    usersWithBalance,
    usersWithEarnings,
    topBalanceUsers
  ] = await Promise.all([
    prisma.user.aggregate({
      _sum: { balance: true },
      where
    }),
    prisma.user.aggregate({
      _sum: { availableVoucherPkr: true },
      where
    }),
    prisma.user.count({
      where: { balance: { gt: 0 } }
    }),
    prisma.user.count({
      where: { totalEarnings: { gt: 0 } }
    }),
    prisma.user.findMany({
      where: { balance: { gt: 0 } },
      orderBy: { balance: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        balance: true,
        totalEarnings: true,
        pendingCommission: true
      }
    })
  ])

  return {
    totalUserBalance: totalUserBalance._sum.balance || 0,
    totalVoucherBalance: totalVoucherBalance._sum.availableVoucherPkr || 0,
    usersWithBalance,
    usersWithEarnings,
    topBalanceUsers
  }
}

// Monthly Trends
async function getMonthlyTrends(dateRange: { startDate: Date, endDate: Date }) {
  const monthlyRevenue = await prisma.$queryRaw`
    SELECT 
      DATE_FORMAT(createdAt, '%Y-%m') as month,
      SUM(totalPkr) as revenue,
      SUM(paidAmountPkr) as paidRevenue,
      COUNT(*) as orders
    FROM orders 
    WHERE createdAt >= ${dateRange.startDate} 
      AND createdAt <= ${dateRange.endDate}
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month ASC
  ` as any[]

  const monthlyCommissions = await prisma.$queryRaw`
    SELECT 
      DATE_FORMAT(updatedAt, '%Y-%m') as month,
      SUM(totalEarnings) as commissions,
      COUNT(*) as earners
    FROM users 
    WHERE updatedAt >= ${dateRange.startDate} 
      AND updatedAt <= ${dateRange.endDate}
      AND totalEarnings > 0
    GROUP BY DATE_FORMAT(updatedAt, '%Y-%m')
    ORDER BY month ASC
  ` as any[]

  return {
    revenue: monthlyRevenue,
    commissions: monthlyCommissions
  }
}

// Payment Method Stats
async function getPaymentMethodStats(dateRange: { startDate: Date, endDate: Date }) {
  return await prisma.order.groupBy({
    by: ['paymentMethod'],
    _count: { id: true },
    _sum: { totalPkr: true },
    where: {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate
      },
      paymentStatus: 'PAID'
    },
    orderBy: { _sum: { totalPkr: 'desc' } }
  })
}

// Top Earners
async function getTopEarners(dateRange: { startDate: Date, endDate: Date }) {
  return await prisma.user.findMany({
    where: {
      totalEarnings: { gt: 0 },
      updatedAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate
      }
    },
    orderBy: { totalEarnings: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      totalEarnings: true,
      pendingCommission: true,
      balance: true,
      referralCode: true
    }
  })
}

// Recent Transactions
async function getRecentTransactions() {
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          avatar: true
        }
      }
    }
  })

  return recentOrders.map(order => ({
    id: order.id,
    type: 'order',
    amount: order.totalPkr,
    paidAmount: order.paidAmountPkr,
    status: order.paymentStatus,
    user: order.user,
    createdAt: order.createdAt,
    description: `Order #${order.orderNumber}`
  }))
} 