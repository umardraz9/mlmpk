import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// In-memory storage for commission rates (in a real app, this would be in database)
let commissionRates = {
  directReferral: 10, // 10% commission on direct referrals
  level2: 5,          // 5% commission on level 2
  level3: 3,          // 3% commission on level 3
  level4: 2,          // 2% commission on level 4
  level5: 1,          // 1% commission on level 5
  maxLevels: 5,       // Maximum levels for commission
  minimumPayout: 100, // Minimum amount for payout (PKR)
  payoutSchedule: 'weekly', // weekly, monthly, instant
  taskCommissionRate: 15, // 15% commission on task completions
  productCommissionRate: 8, // 8% commission on product sales
  bonusThresholds: {
    bronze: { referrals: 5, bonus: 500 },
    silver: { referrals: 10, bonus: 1500 },
    gold: { referrals: 25, bonus: 5000 },
    platinum: { referrals: 50, bonus: 15000 }
  }
}

// GET - Get commission rates and rules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get commission statistics
    const stats = await getCommissionStats()

    return NextResponse.json({
      rates: commissionRates,
      statistics: stats
    })
  } catch (error) {
    console.error('Error fetching commission rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update commission rates
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate commission rates
    const validatedRates = {
      directReferral: Math.max(0, Math.min(100, data.directReferral || 0)),
      level2: Math.max(0, Math.min(100, data.level2 || 0)),
      level3: Math.max(0, Math.min(100, data.level3 || 0)),
      level4: Math.max(0, Math.min(100, data.level4 || 0)),
      level5: Math.max(0, Math.min(100, data.level5 || 0)),
      maxLevels: Math.max(1, Math.min(10, data.maxLevels || 5)),
      minimumPayout: Math.max(0, data.minimumPayout || 100),
      payoutSchedule: ['instant', 'weekly', 'monthly'].includes(data.payoutSchedule) ? data.payoutSchedule : 'weekly',
      taskCommissionRate: Math.max(0, Math.min(100, data.taskCommissionRate || 0)),
      productCommissionRate: Math.max(0, Math.min(100, data.productCommissionRate || 0)),
      bonusThresholds: {
        bronze: {
          referrals: Math.max(1, data.bonusThresholds?.bronze?.referrals || 5),
          bonus: Math.max(0, data.bonusThresholds?.bronze?.bonus || 500)
        },
        silver: {
          referrals: Math.max(1, data.bonusThresholds?.silver?.referrals || 10),
          bonus: Math.max(0, data.bonusThresholds?.silver?.bonus || 1500)
        },
        gold: {
          referrals: Math.max(1, data.bonusThresholds?.gold?.referrals || 25),
          bonus: Math.max(0, data.bonusThresholds?.gold?.bonus || 5000)
        },
        platinum: {
          referrals: Math.max(1, data.bonusThresholds?.platinum?.referrals || 50),
          bonus: Math.max(0, data.bonusThresholds?.platinum?.bonus || 15000)
        }
      }
    }

    // Update commission rates
    commissionRates = validatedRates

    return NextResponse.json({
      message: 'Commission rates updated successfully',
      rates: commissionRates
    })
  } catch (error) {
    console.error('Error updating commission rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Calculate commission for a transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, amount, type } = await request.json()

    if (!userId || !amount || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const commissions = await calculateCommission(userId, amount, type)

    return NextResponse.json({
      commissions,
      totalCommission: commissions.reduce((sum, c) => sum + c.amount, 0)
    })
  } catch (error) {
    console.error('Error calculating commission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate commission
async function calculateCommission(userId: string, amount: number, type: string) {
  const commissions = []
  
  // Get user's sponsor hierarchy
  const sponsors = await getSponsorHierarchy(userId)
  
  // Determine commission rate based on type
  let baseRate = 0
  switch (type) {
    case 'product':
      baseRate = commissionRates.productCommissionRate / 100
      break
    case 'task':
      baseRate = commissionRates.taskCommissionRate / 100
      break
    case 'referral':
      baseRate = commissionRates.directReferral / 100
      break
    default:
      baseRate = 0.1 // Default 10%
  }

  // Calculate commission for each level
  const levelRates = [
    commissionRates.directReferral / 100,
    commissionRates.level2 / 100,
    commissionRates.level3 / 100,
    commissionRates.level4 / 100,
    commissionRates.level5 / 100
  ]

  for (let i = 0; i < Math.min(sponsors.length, commissionRates.maxLevels); i++) {
    const sponsor = sponsors[i]
    const rate = levelRates[i] || 0
    const commissionAmount = amount * rate

    if (commissionAmount > 0) {
      commissions.push({
        userId: sponsor.id,
        userName: sponsor.name || sponsor.email,
        level: i + 1,
        rate: rate * 100,
        amount: commissionAmount,
        originalAmount: amount,
        type
      })
    }
  }

  return commissions
}

// Helper function to get sponsor hierarchy
async function getSponsorHierarchy(userId: string) {
  const sponsors = []
  let currentUserId = userId

  while (currentUserId && sponsors.length < commissionRates.maxLevels) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        email: true,
        sponsorId: true,
        isActive: true
      }
    })

    if (!user?.sponsorId) break

    const sponsor = await prisma.user.findUnique({
      where: { id: user.sponsorId },
      select: {
        id: true,
        name: true,
        email: true,
        sponsorId: true,
        isActive: true
      }
    })

    if (sponsor && sponsor.isActive) {
      sponsors.push(sponsor)
      currentUserId = sponsor.id
    } else {
      break
    }
  }

  return sponsors
}

// Helper function to get commission statistics
async function getCommissionStats() {
  const [
    totalCommissions,
    pendingPayouts,
    monthlyCommissions,
    topEarners,
    recentTransactions
  ] = await Promise.all([
    prisma.user.aggregate({
      _sum: { totalEarnings: true }
    }),
    prisma.user.aggregate({
      _sum: { pendingCommission: true }
    }),
    prisma.user.aggregate({
      _sum: { totalEarnings: true },
      where: {
        updatedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.user.findMany({
      where: { totalEarnings: { gt: 0 } },
      select: {
        id: true,
        name: true,
        email: true,
        totalEarnings: true,
        pendingCommission: true
      },
      orderBy: { totalEarnings: 'desc' },
      take: 5
    }),
    prisma.user.findMany({
      where: { 
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        OR: [
          { totalEarnings: { gt: 0 } },
          { pendingCommission: { gt: 0 } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        totalEarnings: true,
        pendingCommission: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })
  ])

  return {
    totalCommissions: totalCommissions._sum.totalEarnings || 0,
    pendingPayouts: pendingPayouts._sum.pendingCommission || 0,
    monthlyCommissions: monthlyCommissions._sum.totalEarnings || 0,
    topEarners,
    recentTransactions
  }
} 