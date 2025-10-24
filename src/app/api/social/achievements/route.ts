import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'

// GET - Fetch user achievements
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const publicOnly = searchParams.get('publicOnly') === 'true'

    // Build where clause
    const where: any = { userId }
    if (publicOnly || userId !== session.user.id) {
      where.isPublic = true
    }

    // Fetch achievements
    const achievements = await prisma.userAchievement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    // Format achievements
    const formattedAchievements = achievements.map(achievement => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      points: achievement.points,
      createdAt: achievement.createdAt,
      user: {
        id: achievement.user.id,
        name: achievement.user.name || 'Anonymous',
        username: achievement.user.username || `@user${achievement.user.id.slice(-4)}`,
        avatar: achievement.user.avatar || '/api/placeholder/40/40'
      }
    }))

    return NextResponse.json({ achievements: formattedAchievements })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new achievement
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, icon, type, points = 0, isPublic = true } = body

    if (!title || !description || !type) {
      return NextResponse.json({ 
        error: 'Title, description, and type are required' 
      }, { status: 400 })
    }

    // Create achievement
    const achievement = await prisma.userAchievement.create({
      data: {
        userId: session.user.id,
        title,
        description,
        icon: icon || '🏆',
        type,
        points,
        isPublic
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    // Award points to user
    if (points > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          totalPoints: { increment: points }
        }
      })
    }

    // Format response
    const formattedAchievement = {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      points: achievement.points,
      createdAt: achievement.createdAt,
      user: {
        id: achievement.user.id,
        name: achievement.user.name || 'Anonymous',
        username: achievement.user.username || `@user${achievement.user.id.slice(-4)}`,
        avatar: achievement.user.avatar || '/api/placeholder/40/40'
      }
    }

    return NextResponse.json({ achievement: formattedAchievement })
  } catch (error) {
    console.error('Error creating achievement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
