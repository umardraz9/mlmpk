import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [ordersSum, ordersMonthlySum, commissionsSum, withdrawalsCompletedSum, withdrawalsPendingSum] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalPkr: true } }),
      prisma.order.aggregate({ _sum: { totalPkr: true }, where: { createdAt: { gte: monthAgo } } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'COMMISSION', status: 'COMPLETED' } }),
      prisma.withdrawalRequest.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
      prisma.withdrawalRequest.aggregate({ _sum: { amount: true }, where: { status: 'PENDING' } }),
    ])

    const stats = {
      totalRevenue: Number(ordersSum._sum.totalPkr ?? 0),
      monthlyRevenue: Number(ordersMonthlySum._sum.totalPkr ?? 0),
      totalCommissions: Number(commissionsSum._sum.amount ?? 0),
      totalWithdrawals: Number(withdrawalsCompletedSum._sum.amount ?? 0),
      pendingWithdrawals: Number(withdrawalsPendingSum._sum.amount ?? 0),
      revenueGrowth: 0,
      commissionGrowth: 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Finance stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
