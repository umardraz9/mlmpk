import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'

// GET - Fetch user's team members
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch team members where current user is the leader
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        leaderId: session.user.id,
        status: 'active'
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            totalPoints: true,
            isActive: true,
            createdAt: true
          }
        }
      },
      orderBy: { commission: 'desc' }
    })

    // Format team members data
    const formattedMembers = teamMembers.map(tm => ({
      id: tm.id,
      name: tm.member.name || 'Anonymous',
      username: tm.member.username || `@user${tm.member.id.slice(-4)}`,
      avatar: tm.member.avatar || '/api/placeholder/40/40',
      level: tm.level,
      status: tm.member.isActive ? 'online' : 'offline',
      lastActive: tm.member.isActive ? 'Active now' : 'Offline',
      commission: tm.commission,
      role: tm.role,
      joinedAt: tm.joinedAt,
      totalPoints: tm.member.totalPoints || 0
    }))

    // Get team statistics
    const stats = {
      totalMembers: teamMembers.length,
      activeMembers: teamMembers.filter(tm => tm.member.isActive).length,
      totalCommission: teamMembers.reduce((sum, tm) => sum + tm.commission, 0),
      avgLevel: teamMembers.length > 0 
        ? Math.round(teamMembers.reduce((sum, tm) => sum + tm.level, 0) / teamMembers.length)
        : 0
    }

    return NextResponse.json({
      teamMembers: formattedMembers,
      stats
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add new team member
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { memberId, role = 'member' } = body

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Check if member exists
    const member = await prisma.user.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if already a team member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        leaderId_memberId: {
          leaderId: session.user.id,
          memberId
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 })
    }

    // Create team member relationship
    const teamMember = await prisma.teamMember.create({
      data: {
        leaderId: session.user.id,
        memberId,
        role,
        level: 1,
        commission: 0
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            totalPoints: true,
            isActive: true
          }
        }
      }
    })

    // Format response
    const formattedMember = {
      id: teamMember.id,
      name: teamMember.member.name || 'Anonymous',
      username: teamMember.member.username || `@user${teamMember.member.id.slice(-4)}`,
      avatar: teamMember.member.avatar || '/api/placeholder/40/40',
      level: teamMember.level,
      status: teamMember.member.isActive ? 'online' : 'offline',
      lastActive: teamMember.member.isActive ? 'Active now' : 'Offline',
      commission: teamMember.commission,
      role: teamMember.role,
      joinedAt: teamMember.joinedAt,
      totalPoints: teamMember.member.totalPoints || 0
    }

    return NextResponse.json({ teamMember: formattedMember })
  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
