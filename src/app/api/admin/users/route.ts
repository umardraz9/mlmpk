import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET - List users with search and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role) {
      where.role = role
    }
    
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sponsor: { select: { name: true } },
          _count: { select: { referrals: true } },
        },
      }),
      prisma.user.count({ where })
    ])

    // Get user analytics
    const analytics = await prisma.user.aggregate({
      _count: { id: true },
      _sum: { 
        balance: true,
        totalEarnings: true,
        pendingCommission: true
      },
      where: { isActive: true }
    })

    const [totalUsers, totalActiveUsers, totalInactiveUsers, totalAdmins, totalReferrals] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.user.count({ where: { NOT: { sponsorId: null } } })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      analytics: {
        totalUsers,
        activeUsers: totalActiveUsers,
        inactiveUsers: totalInactiveUsers,
        totalAdmins,
        totalReferrals,
        totalBalance: analytics._sum.balance || 0,
        totalEarnings: analytics._sum.totalEarnings || 0,
        pendingCommissions: analytics._sum.pendingCommission || 0
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const {
      name,
      email,
      username,
      phone,
      password,
      role = 'USER',
      isActive = true,
      isAdmin = false,
      sponsorId,
      balance = 0,
      totalEarnings = 0,
      pendingCommission = 0
    } = data

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: username || '' }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        phone,
        password: hashedPassword,
        role,
        isActive,
        isAdmin,
        sponsorId,
        balance,
        totalEarnings,
        pendingCommission,
        referralCode: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase()
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        isAdmin: true,
        sponsorId: true,
        balance: true,
        totalEarnings: true,
        pendingCommission: true,
        referralCode: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 