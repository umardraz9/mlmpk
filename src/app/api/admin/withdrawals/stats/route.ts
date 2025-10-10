import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (dateRange) {
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
        startDate = new Date(0)
    }

    const where = {
      requestedAt: {
        gte: startDate
      }
    }

    // Get basic stats
    const [
      pendingCount,
      approvedCount,
      completedCount,
      rejectedCount,
      pendingAmount,
      approvedAmount,
      completedAmount,
      rejectedAmount,
    ] = await Promise.all([
      prisma.withdrawalRequest.count({ where: { ...where, status: 'PENDING' } }),
      prisma.withdrawalRequest.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.withdrawalRequest.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.withdrawalRequest.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.withdrawalRequest.aggregate({
        where: { ...where, status: 'PENDING' },
        _sum: { amount: true }
      }),
      prisma.withdrawalRequest.aggregate({
        where: { ...where, status: 'APPROVED' },
        _sum: { amount: true }
      }),
      prisma.withdrawalRequest.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.withdrawalRequest.aggregate({
        where: { ...where, status: 'REJECTED' },
        _sum: { amount: true }
      }),
    ]);

    // Calculate average processing time
    let avgProcessingTime = 'N/A'
    const averageProcessingTime = await prisma.withdrawalRequest.findMany({
      where: { ...where, processedAt: { not: null } },
      select: { requestedAt: true, processedAt: true }
    })
    if (averageProcessingTime.length > 0) {
      const totalTime = averageProcessingTime.reduce((sum, withdrawal) => {
        const requested = new Date(withdrawal.requestedAt)
        const processed = new Date(withdrawal.processedAt!)
        return sum + (processed.getTime() - requested.getTime())
      }, 0)
      const avgTimeMs = totalTime / averageProcessingTime.length
      const avgDays = Math.floor(avgTimeMs / (1000 * 60 * 60 * 24))
      const avgHours = Math.floor((avgTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      avgProcessingTime = `${avgDays}d ${avgHours}h`
    }

    // Get payment method stats
    const paymentMethodStats = await prisma.withdrawalRequest.groupBy({
      by: ['paymentMethod', 'status'],
      where,
      _count: { _all: true },
      _sum: { amount: true }
    })

    // Get daily trends
    // Get daily trends
    const dailyTrends = await prisma.withdrawalRequest.findMany({
      where,
      select: {
        requestedAt: true,
        amount: true,
        status: true
      },
      orderBy: { requestedAt: 'asc' }
    })

    // Group by day
    const dailyStats = dailyTrends.reduce((acc: any, withdrawal: any) => {
      const date = withdrawal.requestedAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, total: 0, pending: 0, approved: 0, rejected: 0, completed: 0 }
      }
      acc[date].total += withdrawal.amount
      acc[date][withdrawal.status.toLowerCase()] += withdrawal.amount
      return acc
    }, {})

    const trendData = Object.values(dailyStats).slice(-30) // Last 30 days

    return NextResponse.json({
      totalRequests: pendingCount + approvedCount + completedCount + rejectedCount,
      pendingRequests: pendingCount,
      approvedRequests: approvedCount,
      rejectedRequests: rejectedCount,
      completedRequests: completedCount,
      totalAmount: pendingAmount._sum.amount + approvedAmount._sum.amount + completedAmount._sum.amount + rejectedAmount._sum.amount,
      pendingAmount: pendingAmount._sum.amount || 0,
      approvedAmount: approvedAmount._sum.amount || 0,
      rejectedAmount: rejectedAmount._sum.amount || 0,
      completedAmount: completedAmount._sum.amount || 0,
      avgProcessingTime,
      paymentMethodStats,
      trends: trendData,
    })
  } catch (error) {
    console.error('Error fetching withdrawal stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
