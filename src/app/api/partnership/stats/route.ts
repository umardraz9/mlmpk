import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCode: true,
        totalEarnings: true,
        pendingCommission: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get referral counts by level
    const level1Referrals = await prisma.user.findMany({
      where: { sponsorId: session.user.id },
      select: { id: true }
    })

    const level2Referrals = await prisma.user.findMany({
      where: { 
        sponsorId: { 
          in: level1Referrals.map(u => u.id) 
        } 
      },
      select: { id: true }
    })

    const level3Referrals = await prisma.user.findMany({
      where: { 
        sponsorId: { 
          in: level2Referrals.map(u => u.id) 
        } 
      },
      select: { id: true }
    })

    const level4Referrals = await prisma.user.findMany({
      where: { 
        sponsorId: { 
          in: level3Referrals.map(u => u.id) 
        } 
      },
      select: { id: true }
    })

    const level5Referrals = await prisma.user.findMany({
      where: { 
        sponsorId: { 
          in: level4Referrals.map(u => u.id) 
        } 
      },
      select: { id: true }
    })

    // Calculate monthly earnings (current month)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: 'COMMISSION',
        createdAt: {
          gte: currentMonth
        }
      },
      select: { amount: true }
    })

    const monthlyEarnings = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0)

    const stats = {
      referralCode: user.referralCode,
      totalReferrals: level1Referrals.length + level2Referrals.length + level3Referrals.length + level4Referrals.length + level5Referrals.length,
      totalCommissions: user.totalEarnings,
      level1Count: level1Referrals.length,
      level2Count: level2Referrals.length,
      level3Count: level3Referrals.length,
      level4Count: level4Referrals.length,
      level5Count: level5Referrals.length,
      monthlyEarnings: monthlyEarnings
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Partnership stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
