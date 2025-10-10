import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Commission data and analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all' // all, pending, paid
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'totalEarnings'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status === 'pending') {
      where.pendingCommission = { gt: 0 }
    } else if (status === 'paid') {
      where.totalEarnings = { gt: 0 }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { username: { contains: search } },
        { referralCode: { contains: search } }
      ]
    }

    // Get commission data
    const [commissionUsers, total, summaryStats] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          avatar: true,
          totalEarnings: true,
          pendingCommission: true,
          balance: true,
          referralCode: true,
          sponsorId: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where }),
      getCommissionSummary()
    ])

    // Get sponsor information and referral counts
    const enrichedUsers = await Promise.all(
      commissionUsers.map(async (user) => {
        const [sponsor, referralCount, totalReferralEarnings] = await Promise.all([
          user.sponsorId ? prisma.user.findUnique({
            where: { id: user.sponsorId },
            select: { id: true, name: true, email: true, username: true, referralCode: true }
          }) : null,
          prisma.user.count({ where: { sponsorId: user.id } }),
          prisma.user.aggregate({
            _sum: { totalEarnings: true },
            where: { sponsorId: user.id }
          })
        ])

        return {
          ...user,
          sponsor,
          referralCount,
          totalReferralEarnings: totalReferralEarnings._sum.totalEarnings || 0
        }
      })
    )

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      summary: summaryStats
    })
  } catch (error) {
    console.error('Error fetching commission data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Process commission payouts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userIds, payoutType, amount } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 })
    }

    const results = []

    for (const userId of userIds) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            pendingCommission: true,
            balance: true,
            totalEarnings: true
          }
        })

        if (!user) {
          results.push({ userId, success: false, error: 'User not found' })
          continue
        }

        let payoutAmount = amount
        if (payoutType === 'pending') {
          payoutAmount = user.pendingCommission
        } else if (payoutType === 'custom' && (!amount || amount <= 0)) {
          results.push({ userId, success: false, error: 'Invalid payout amount' })
          continue
        }

        if (payoutAmount <= 0) {
          results.push({ userId, success: false, error: 'No amount to payout' })
          continue
        }

        // Process payout
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: payoutAmount
            },
            pendingCommission: payoutType === 'pending' ? 0 : {
              decrement: Math.min(payoutAmount, user.pendingCommission)
            }
          }
        })

        results.push({
          userId,
          success: true,
          payoutAmount,
          newBalance: updatedUser.balance,
          newPendingCommission: updatedUser.pendingCommission
        })

        // Log the payout (in a real app, you'd store this in a transaction log table)
        console.log(`Commission payout processed: ${payoutAmount} PKR to user ${userId} by admin ${session.user.id}`)

      } catch (error) {
        console.error(`Error processing payout for user ${userId}:`, error)
        results.push({ userId, success: false, error: 'Processing failed' })
      }
    }

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })
  } catch (error) {
    console.error('Error processing commission payouts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get commission summary
async function getCommissionSummary() {
  const [
    totalPendingCommissions,
    totalPaidCommissions,
    totalActiveEarners,
    totalCommissionBalance,
    monthlyCommissions,
    topPerformer
  ] = await Promise.all([
    prisma.user.aggregate({
      _sum: { pendingCommission: true },
      where: { pendingCommission: { gt: 0 } }
    }),
    prisma.user.aggregate({
      _sum: { totalEarnings: true },
      where: { totalEarnings: { gt: 0 } }
    }),
    prisma.user.count({
      where: { totalEarnings: { gt: 0 } }
    }),
    prisma.user.aggregate({
      _sum: { balance: true },
      where: { balance: { gt: 0 } }
    }),
    prisma.user.aggregate({
      _sum: { totalEarnings: true },
      where: {
        updatedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.user.findFirst({
      where: { totalEarnings: { gt: 0 } },
      orderBy: { totalEarnings: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        totalEarnings: true,
        pendingCommission: true
      }
    })
  ])

  return {
    totalPendingCommissions: totalPendingCommissions._sum.pendingCommission || 0,
    totalPaidCommissions: totalPaidCommissions._sum.totalEarnings || 0,
    totalActiveEarners,
    totalCommissionBalance: totalCommissionBalance._sum.balance || 0,
    monthlyCommissions: monthlyCommissions._sum.totalEarnings || 0,
    topPerformer,
    averageCommissionPerUser: totalActiveEarners > 0 ? (totalPaidCommissions._sum.totalEarnings || 0) / totalActiveEarners : 0
  }
} 