import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

// GET - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const { id } = await params;
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalPkr: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        blogPosts: {
          select: {
            id: true,
            title: true,
            slug: true,
            views: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        blogComments: {
          select: {
            id: true,
            content: true,
            isApproved: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const referralStats = await prisma.user.count({
      where: { referredBy: user.referralCode }
    })

    let sponsor = null as any
    if (user.sponsorId) {
      sponsor = await prisma.user.findUnique({
        where: { id: user.sponsorId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          referralCode: true
        }
      })
    }

    return NextResponse.json({
      ...user,
      referralStats,
      sponsor,
      password: undefined as any
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Partially update user (used by admin users list edit modal)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const { id } = await params;
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();
    const {
      name,
      email,
      username,
      firstName,
      lastName,
      phone,
      password,
      role,
      isActive,
      isAdmin,
      sponsorId,
      membershipPlan,
      membershipStatus,
      tasksEnabled,
      balance,
      totalEarnings,
      pendingCommission,
      avatar
    } = body;

    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build partial update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (username !== undefined) updateData.username = username
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin
    if (sponsorId !== undefined) updateData.sponsorId = sponsorId
    if (membershipPlan !== undefined) updateData.membershipPlan = membershipPlan ? String(membershipPlan).toUpperCase() : null
    if (membershipStatus !== undefined) updateData.membershipStatus = membershipStatus
    if (tasksEnabled !== undefined) updateData.tasksEnabled = !!tasksEnabled
    if (balance !== undefined) updateData.balance = balance
    if (totalEarnings !== undefined) updateData.totalEarnings = totalEarnings
    if (pendingCommission !== undefined) updateData.pendingCommission = pendingCommission
    if (avatar !== undefined) updateData.avatar = avatar

    if (password !== undefined && password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isAdmin: true,
        sponsorId: true,
        balance: true,
        totalEarnings: true,
        pendingCommission: true,
        referralCode: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error patching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await params;
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      username,
      firstName,
      lastName,
      phone,
      password,
      role,
      isActive,
      isAdmin,
      sponsorId,
      membershipPlan,
      membershipStatus,
      tasksEnabled,
      balance,
      totalEarnings,
      pendingCommission,
      avatar
    } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check for email/username conflicts
    if (email || username) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { email },
                { username: username || '' }
              ]
            }
          ]
        }
      })

      if (conflictUser) {
        return NextResponse.json({ error: 'User with this email or username already exists' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (username !== undefined) updateData.username = username
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin
    if (sponsorId !== undefined) updateData.sponsorId = sponsorId
    if (membershipPlan !== undefined) updateData.membershipPlan = membershipPlan ? String(membershipPlan).toUpperCase() : null
    if (membershipStatus !== undefined) updateData.membershipStatus = membershipStatus
    if (tasksEnabled !== undefined) updateData.tasksEnabled = !!tasksEnabled
    if (balance !== undefined) updateData.balance = balance
    if (totalEarnings !== undefined) updateData.totalEarnings = totalEarnings
    if (pendingCommission !== undefined) updateData.pendingCommission = pendingCommission
    if (avatar !== undefined) updateData.avatar = avatar

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isAdmin: true,
        sponsorId: true,
        balance: true,
        totalEarnings: true,
        pendingCommission: true,
        referralCode: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete user (soft delete by deactivating)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const { id } = await params;
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the current admin user
    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { 
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
      }
    })

    return NextResponse.json({ message: 'User deactivated successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 