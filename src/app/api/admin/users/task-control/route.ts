import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { userId, enabled } = await request.json()

    if (!userId || typeof enabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'User ID and enabled status are required'
      }, { status: 400 })
    }

    // Update user's task enabled status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { tasksEnabled: enabled },
      select: {
        id: true,
        name: true,
        email: true,
        tasksEnabled: true,
        membershipStatus: true,
        membershipPlan: true
      }
    })

    // Log the action
    await prisma.notification.create({
      data: {
        title: `Tasks ${enabled ? 'Enabled' : 'Disabled'}`,
        message: `Admin ${enabled ? 'enabled' : 'disabled'} tasks for user ${updatedUser.name || updatedUser.email}`,
        type: 'info',
        category: 'admin_action',
        role: 'admin',
        data: JSON.stringify({
          userId: updatedUser.id,
          userName: updatedUser.name || updatedUser.email,
          action: enabled ? 'enable_tasks' : 'disable_tasks',
          previousStatus: !enabled,
          newStatus: enabled
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: `Tasks ${enabled ? 'enabled' : 'disabled'} for user successfully`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user task status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update user task status'
    }, { status: 500 })
  }
}

// GET: Fetch users with their task status for admin management
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit

    // Build where clause
    let whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { referralCode: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status === 'enabled') {
      whereClause.tasksEnabled = true
    } else if (status === 'disabled') {
      whereClause.tasksEnabled = false
    } else if (status === 'active') {
      whereClause.membershipStatus = 'ACTIVE'
    } else if (status === 'inactive') {
      whereClause.membershipStatus = 'INACTIVE'
    }

    // Get users with task status
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          referralCode: true,
          tasksEnabled: true,
          membershipStatus: true,
          membershipPlan: true,
          membershipStartDate: true,
          createdAt: true,
          tasksCompleted: true,
          balance: true,
          isActive: true
        },
        orderBy: [
          { membershipStatus: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      filters: {
        search,
        status
      }
    })

  } catch (error) {
    console.error('Error fetching users for task management:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 })
  }
}