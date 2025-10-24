import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// Demo users data
const demoUsers = [
  {
    id: 'user-2',
    name: 'Ahmed Khan',
    username: 'ahmed_khan',
    image: '/images/avatars/ahmed.jpg',
    totalPoints: 2500,
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    membershipPlan: 'PREMIUM',
    partnerLevel: 'GOLD'
  },
  {
    id: 'user-3',
    name: 'Fatima Ali',
    username: 'fatima_ali',
    image: '/images/avatars/fatima.jpg',
    totalPoints: 3200,
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    membershipPlan: 'PREMIUM',
    partnerLevel: 'PLATINUM'
  },
  {
    id: 'user-4',
    name: 'Hassan Ali',
    username: 'hassan_ali',
    image: '/images/avatars/hassan.jpg',
    totalPoints: 1800,
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    membershipPlan: 'BASIC',
    partnerLevel: 'SILVER'
  }
]

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'online'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Use demo users (exclude current user)
    const users = demoUsers.filter(u => u.id !== session.user.id).slice(0, limit)

    // Format the users data
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name || 'Anonymous',
      username: user.username || `@user${user.id.slice(-4)}`,
      avatar: user.image || '/api/placeholder/40/40',
      level: Math.floor((user.totalPoints || 0) / 1000) + 1,
      verified: (user.totalPoints || 0) > 5000,
      membershipPlan: user.membershipPlan || 'BASIC',
      partnerLevel: user.partnerLevel || 'Bronze',
      mutualFriends: 0,
      status: type === 'online' ? 'online' : 'offline',
      lastActive: user.createdAt,
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
