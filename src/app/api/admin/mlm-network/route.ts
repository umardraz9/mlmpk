import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get MLM network data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const level = searchParams.get('level')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Get network data
    const networkData = await getNetworkData(userId, level, includeInactive)
    const networkStats = await getNetworkStats()

    return NextResponse.json({
      network: networkData,
      stats: networkStats
    })
  } catch (error) {
    console.error('Error fetching MLM network:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get network data
async function getNetworkData(userId?: string | null, level?: string | null, includeInactive: boolean = false) {
  const whereClause: any = {}
  
  if (!includeInactive) {
    whereClause.isActive = true
  }

  if (userId) {
    whereClause.id = userId
  }

  // Get root users (users without sponsors or specified user)
  const rootUsers = await prisma.user.findMany({
    where: userId ? { id: userId } : { sponsorId: null, ...whereClause },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      isActive: true,
      sponsorId: true,
      balance: true,
      totalEarnings: true,
      pendingCommission: true,
      createdAt: true,
      referralCode: true
    }
  })

  // Build tree structure recursively
  const buildTree = async (parentId: string, currentLevel: number = 1): Promise<any[]> => {
    if (level && parseInt(level) < currentLevel) {
      return []
    }

    const children = await prisma.user.findMany({
      where: { sponsorId: parentId, ...whereClause },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        sponsorId: true,
        balance: true,
        totalEarnings: true,
        pendingCommission: true,
        createdAt: true,
        referralCode: true
      }
    })

    const enrichedChildren = await Promise.all(
      children.map(async (child) => {
        const [referralCount, teamSize, teamEarnings] = await Promise.all([
          prisma.user.count({ where: { sponsorId: child.id } }),
          getTeamSize(child.id),
          getTeamEarnings(child.id)
        ])

        return {
          ...child,
          level: currentLevel,
          referralCount,
          children: await buildTree(child.id, currentLevel + 1),
          totalTeamSize: teamSize,
          totalTeamEarnings: teamEarnings
        }
      })
    )

    return enrichedChildren
  }

  // Get team size recursively
  const getTeamSize = async (userId: string): Promise<number> => {
    const children = await prisma.user.findMany({
      where: { sponsorId: userId },
      select: { id: true }
    })

    let totalSize = children.length
    
    for (const child of children) {
      totalSize += await getTeamSize(child.id)
    }

    return totalSize
  }

  // Get team earnings recursively
  const getTeamEarnings = async (userId: string): Promise<number> => {
    const children = await prisma.user.findMany({
      where: { sponsorId: userId },
      select: { id: true, totalEarnings: true }
    })

    let totalEarnings = children.reduce((sum, child) => sum + child.totalEarnings, 0)
    
    for (const child of children) {
      totalEarnings += await getTeamEarnings(child.id)
    }

    return totalEarnings
  }

  // Build complete network tree
  const networkTree = await Promise.all(
    rootUsers.map(async (user) => {
      const [referralCount, teamSize, teamEarnings] = await Promise.all([
        prisma.user.count({ where: { sponsorId: user.id } }),
        getTeamSize(user.id),
        getTeamEarnings(user.id)
      ])

      return {
        ...user,
        level: 1,
        referralCount,
        children: await buildTree(user.id, 2),
        totalTeamSize: teamSize,
        totalTeamEarnings: teamEarnings
      }
    })
  )

  return networkTree
}

// Helper function to get network statistics
async function getNetworkStats() {
  const [
    totalUsers,
    activeUsers,
    totalEarnings,
    totalReferrals,
    topPerformers,
    levelDistribution
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.aggregate({
      _sum: { totalEarnings: true }
    }).then(result => result._sum.totalEarnings || 0),
    prisma.user.count({ where: { sponsorId: { not: null } } }),
    // Top performers by earnings
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        name: true,
        email: true,
        totalEarnings: true,
        referralCode: true
      },
      orderBy: { totalEarnings: 'desc' },
      take: 10
    }),
    // Level distribution
    prisma.$queryRaw`
      WITH RECURSIVE user_levels AS (
        SELECT 
          id,
          sponsorId,
          1 as level,
          totalEarnings,
          name,
          email
        FROM User
        WHERE sponsorId IS NULL
        
        UNION ALL
        
        SELECT 
          u.id,
          u.sponsorId,
          ul.level + 1,
          u.totalEarnings,
          u.name,
          u.email
        FROM User u
        INNER JOIN user_levels ul ON u.sponsorId = ul.id
      )
      SELECT 
        level,
        COUNT(*) as users,
        SUM(totalEarnings) as earnings
      FROM user_levels
      GROUP BY level
      ORDER BY level
    `
  ])

  const averageEarnings = totalUsers > 0 ? totalEarnings / totalUsers : 0

  return {
    totalUsers,
    activeUsers,
    totalEarnings,
    totalReferrals,
    averageEarnings,
    topPerformers,
    levelDistribution
  }
}

// POST - Update user sponsor relationship
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { userId, newSponsorId } = data

    if (!userId || !newSponsorId) {
      return NextResponse.json({ error: 'User ID and sponsor ID are required' }, { status: 400 })
    }

    // Prevent circular references
    if (userId === newSponsorId) {
      return NextResponse.json({ error: 'User cannot be their own sponsor' }, { status: 400 })
    }

    // Update user's sponsor
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { sponsorId: newSponsorId }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating MLM network:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
