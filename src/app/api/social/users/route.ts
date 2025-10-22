import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'

// @ts-expect-error - NextAuth getServerSession import issue

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'online'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get current user to exclude from suggestions
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, sponsorId: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let users: any[] = []

    if (type === 'online') {
      // Get users who have been active recently (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

      users = await prisma.user.findMany({
        where: {
          AND: [
            { isActive: true },
            { id: { not: session.user.id } }, // Exclude current user
            {
              OR: [
                // Users with recent activity
                { updatedAt: { gte: thirtyMinutesAgo } },
                // Or users who are currently online (you could track this in a separate field)
                { lastTaskCompletionDate: { gte: thirtyMinutesAgo } }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          totalPoints: true,
          isActive: true,
          createdAt: true,
          membershipPlan: true,
          partnerLevel: true,
          lastTaskCompletionDate: true
        },
        orderBy: [
          { updatedAt: 'desc' },
          { totalPoints: 'desc' }
        ],
        take: limit
      })
    } else if (type === 'suggested') {
      // Get users for "People You May Know" suggestions
      users = await prisma.user.findMany({
        where: {
          AND: [
            { isActive: true },
            { id: { not: session.user.id } }, // Exclude current user
            // Exclude users already followed by current user
            {
              id: {
                notIn: await prisma.socialFollow.findMany({
                  where: { followerId: session.user.id },
                  select: { followingId: true }
                }).then(follows => follows.map(f => f.followingId))
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          totalPoints: true,
          createdAt: true,
          membershipPlan: true,
          partnerLevel: true,
          // Count mutual connections (simplified - in real app would be more complex)
          _count: {
            select: {
              referrals: true // Users they referred
            }
          }
        },
        orderBy: [
          { totalPoints: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      })
    } else if (type === 'birthdays') {
      // Get users with birthdays today (would need birthdate field)
      const today = new Date()
      const month = today.getMonth() + 1 // JavaScript months are 0-indexed
      const day = today.getDate()

      users = await prisma.user.findMany({
        where: {
          AND: [
            { isActive: true },
            { id: { not: session.user.id } }, // Exclude current user
            { birthdate: { not: null } } // Only users with birthdate set
          ]
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          birthdate: true
        },
        orderBy: { name: 'asc' },
        take: limit
      })

      // Filter to only those with birthdays today
      users = users.filter(user => {
        if (!user.birthdate) return false
        const birthDate = new Date(user.birthdate)
        return birthDate.getMonth() + 1 === month && birthDate.getDate() === day
      })
    }

    // Format the users data
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || 'Anonymous',
      username: user.username || `@user${user.id.slice(-4)}`,
      avatar: user.image || '/api/placeholder/40/40',
      level: Math.floor((user.totalPoints || 0) / 1000) + 1,
      verified: (user.totalPoints || 0) > 5000,
      membershipPlan: user.membershipPlan || 'BASIC',
      partnerLevel: user.partnerLevel || 'Bronze',
      mutualFriends: user._count?.referrals || 0,
      status: type === 'online' ? 'online' : 'offline',
      lastActive: user.lastTaskCompletionDate || user.createdAt,
      joinedDate: user.createdAt
    }))

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length
    })

  } catch (error) {
    console.error('Error fetching social users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}
