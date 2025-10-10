import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get MLM network structure
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const depth = parseInt(searchParams.get('depth') || '3')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Get network structure starting from a specific user or top-level users
    const buildNetworkTree = async (sponsorId: string | null, currentDepth: number = 0): Promise<any[]> => {
      if (currentDepth >= depth) return []

      const whereClause: any = { sponsorId }
      if (!includeInactive) {
        whereClause.isActive = true
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          isAdmin: true,
          role: true,
          referralCode: true,
          sponsorId: true,
          balance: true,
          totalEarnings: true,
          pendingCommission: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      const networkNodes = []
      for (const user of users) {
        // Get referral count
        const referralCount = await prisma.user.count({
          where: { 
            sponsorId: user.id,
            ...(includeInactive ? {} : { isActive: true })
          }
        })

        // Get total team earnings
        const teamEarnings = await getTeamEarnings(user.id)

        const children = await buildNetworkTree(user.id, currentDepth + 1)
        
        networkNodes.push({
          ...user,
          referralCount,
          teamEarnings,
          children,
          level: currentDepth + 1
        })
      }

      return networkNodes
    }

    // Get team earnings recursively
    const getTeamEarnings = async (userId: string): Promise<number> => {
      const directReferrals = await prisma.user.findMany({
        where: { sponsorId: userId },
        select: { id: true, totalEarnings: true }
      })

      let totalTeamEarnings = 0
      for (const referral of directReferrals) {
        totalTeamEarnings += referral.totalEarnings
        totalTeamEarnings += await getTeamEarnings(referral.id)
      }

      return totalTeamEarnings
    }

    let networkData
    if (userId) {
      // Get specific user's network
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          isAdmin: true,
          role: true,
          referralCode: true,
          sponsorId: true,
          balance: true,
          totalEarnings: true,
          pendingCommission: true,
          createdAt: true
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const referralCount = await prisma.user.count({
        where: { 
          sponsorId: user.id,
          ...(includeInactive ? {} : { isActive: true })
        }
      })

      const teamEarnings = await getTeamEarnings(user.id)
      const children = await buildNetworkTree(user.id)

      networkData = {
        ...user,
        referralCount,
        teamEarnings,
        children,
        level: 0
      }
    } else {
      // Get top-level network (users without sponsors)
      networkData = await buildNetworkTree(null)
    }

    // Get network analytics
    const analytics = await getNetworkAnalytics()

    return NextResponse.json({
      networkData,
      analytics
    })
  } catch (error) {
    console.error('Error fetching MLM network:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get network analytics
async function getNetworkAnalytics() {
  const [
    totalUsers,
    activeUsers,
    totalLevels,
    topEarners,
    recentJoins,
    commissionStats
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.findMany({
      where: { sponsorId: { not: null } },
      select: { sponsorId: true }
    }),
    prisma.user.findMany({
      where: { totalEarnings: { gt: 0 } },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        totalEarnings: true,
        referralCode: true
      },
      orderBy: { totalEarnings: 'desc' },
      take: 10
    }),
    prisma.user.findMany({
      where: { 
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        sponsorId: { not: null }
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        sponsorId: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.user.aggregate({
      _sum: {
        totalEarnings: true,
        pendingCommission: true,
        balance: true
      }
    })
  ])

  // Calculate network depth
  const networkDepth = await calculateNetworkDepth()
  
  return {
    totalUsers,
    activeUsers,
    networkDepth,
    topEarners,
    recentJoins,
    totalEarnings: commissionStats._sum.totalEarnings || 0,
    pendingCommissions: commissionStats._sum.pendingCommission || 0,
    totalBalance: commissionStats._sum.balance || 0
  }
}

// Helper function to calculate maximum network depth
async function calculateNetworkDepth(): Promise<number> {
  const getDepth = async (userId: string, currentDepth: number = 0): Promise<number> => {
    const children = await prisma.user.findMany({
      where: { sponsorId: userId },
      select: { id: true }
    })

    if (children.length === 0) return currentDepth

    const childDepths = await Promise.all(
      children.map(child => getDepth(child.id, currentDepth + 1))
    )

    return Math.max(...childDepths)
  }

  const topLevelUsers = await prisma.user.findMany({
    where: { sponsorId: null },
    select: { id: true }
  })

  const depths = await Promise.all(
    topLevelUsers.map(user => getDepth(user.id))
  )

  return depths.length > 0 ? Math.max(...depths) : 0
} 