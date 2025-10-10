import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

// GET - Fetch all commission settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commissionSettings = await prisma.commissionSettings.findMany({
      orderBy: { level: 'asc' },
      include: {
        updatedByUser: {
          select: { name: true, email: true }
        }
      }
    })

    // If no settings exist, create default ones
    if (commissionSettings.length === 0) {
      const defaultSettings = [
        { level: 1, rate: 0.20, description: 'MCNmart.com Level 1 - Direct Partnership' },
        { level: 2, rate: 0.15, description: 'MCNmart.com Level 2 - Extended Partnership' },
        { level: 3, rate: 0.10, description: 'MCNmart.com Level 3 - Network Partnership' },
        { level: 4, rate: 0.08, description: 'MCNmart.com Level 4 - Community Partnership' },
        { level: 5, rate: 0.07, description: 'MCNmart.com Level 5 - Team Partnership' },
      ]

      const createdSettings = await Promise.all(
        defaultSettings.map(setting =>
          prisma.commissionSettings.create({
            data: setting,
            include: {
              updatedByUser: {
                select: { name: true, email: true }
              }
            }
          })
        )
      )

      return NextResponse.json(createdSettings)
    }

    return NextResponse.json(commissionSettings)
  } catch (error) {
    console.error('Error fetching commission settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update commission settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 })
    }

    // Validate settings
    for (const setting of settings) {
      if (!setting.level || !setting.rate || setting.rate < 0 || setting.rate > 1) {
        return NextResponse.json({ 
          error: 'Invalid setting: level and rate (0-1) are required' 
        }, { status: 400 })
      }
    }

    // Update each setting
    const updatedSettings = await Promise.all(
      settings.map(async (setting: any) => {
        return await prisma.commissionSettings.upsert({
          where: { level: setting.level },
          update: {
            rate: setting.rate,
            description: setting.description,
            isActive: setting.isActive ?? true,
            updatedBy: session.user.id,
          },
          create: {
            level: setting.level,
            rate: setting.rate,
            description: setting.description,
            isActive: setting.isActive ?? true,
            updatedBy: session.user.id,
          },
          include: {
            updatedByUser: {
              select: { name: true, email: true }
            }
          }
        })
      })
    )

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating commission settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Reset to default settings
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete existing settings
    await prisma.commissionSettings.deleteMany({})

    // Create default settings
    const defaultSettings = [
      { level: 1, rate: 0.20, description: 'MCNmart.com Level 1 - Direct Partnership' },
      { level: 2, rate: 0.15, description: 'MCNmart.com Level 2 - Extended Partnership' },
      { level: 3, rate: 0.10, description: 'MCNmart.com Level 3 - Network Partnership' },
      { level: 4, rate: 0.08, description: 'MCNmart.com Level 4 - Community Partnership' },
      { level: 5, rate: 0.07, description: 'MCNmart.com Level 5 - Team Partnership' },
    ]

    const createdSettings = await Promise.all(
      defaultSettings.map(setting =>
        prisma.commissionSettings.create({
          data: {
            ...setting,
            updatedBy: session.user.id,
          },
          include: {
            updatedByUser: {
              select: { name: true, email: true }
            }
          }
        })
      )
    )

    return NextResponse.json(createdSettings)
  } catch (error) {
    console.error('Error resetting commission settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
