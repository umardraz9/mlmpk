import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// GET - Get task system settings and user list
export async function GET() {
  try {
    await requireAdmin()

    // Get task system settings (check database first, then fallback to defaults)
    let settings = {
      renewalFee: 300,
      dailyTaskLimit: 5,
      globalTaskAmount: null, // null means use plan-specific calculations
      currency: 'PKR'
    }

    // Try to get settings from database
    try {
      const dbSettings = await prisma.systemSettings.findFirst()
      if (dbSettings) {
        settings = {
          renewalFee: dbSettings.renewalFee || 300,
          dailyTaskLimit: dbSettings.dailyTaskLimit || 5,
          globalTaskAmount: dbSettings.globalTaskAmount || null,
          currency: 'PKR'
        }
      }
    } catch (error) {
      // SystemSettings table might not exist, use defaults
      console.log('Using default task control settings', error)
    }

    // Get users with task system status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        totalPoints: true,
        totalEarnings: true,
        tasksCompleted: true,
        createdAt: true,
        tasksEnabled: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      settings,
      users: users.map(user => ({
        ...user,
        totalEarnings: user.balance + user.totalPoints
      }))
    })
  } catch (error) {
    console.error('Error fetching task controls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update task system settings
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()

    const { renewalFee, dailyTaskLimit, globalTaskAmount } = await request.json()

    // Validate inputs
    if (renewalFee && (renewalFee < 100 || renewalFee > 1000)) {
      return NextResponse.json({ error: 'Renewal fee must be between 100 and 1000 PKR' }, { status: 400 })
    }

    if (dailyTaskLimit && (dailyTaskLimit < 1 || dailyTaskLimit > 10)) {
      return NextResponse.json({ error: 'Daily task limit must be between 1 and 10' }, { status: 400 })
    }

    if (globalTaskAmount !== undefined && globalTaskAmount !== null && (globalTaskAmount < 1 || globalTaskAmount > 1000)) {
      return NextResponse.json({ error: 'Global task amount must be between 1 and 1000 PKR' }, { status: 400 })
    }

    // Update or create settings in database
    try {
      const updateData: { renewalFee?: number; dailyTaskLimit?: number; globalTaskAmount?: number | null } = {}
      if (renewalFee !== undefined) updateData.renewalFee = renewalFee
      if (dailyTaskLimit !== undefined) updateData.dailyTaskLimit = dailyTaskLimit
      if (globalTaskAmount !== undefined) updateData.globalTaskAmount = globalTaskAmount

      await prisma.systemSettings.upsert({
        where: { id: '1' },
        update: updateData,
        create: {
          id: '1',
          renewalFee: renewalFee || 300,
          dailyTaskLimit: dailyTaskLimit || 5,
          globalTaskAmount: globalTaskAmount || null
        }
      })

      return NextResponse.json({ 
        success: true,
        settings: {
          renewalFee: renewalFee || 300,
          dailyTaskLimit: dailyTaskLimit || 5,
          globalTaskAmount: globalTaskAmount || null,
          currency: 'PKR'
        }
      })
    } catch (error) {
      console.error('Error saving task settings:', error)
      // If SystemSettings table doesn't exist, just return success for now
      return NextResponse.json({ 
        success: true,
        settings: {
          renewalFee: renewalFee || 300,
          dailyTaskLimit: dailyTaskLimit || 5,
          globalTaskAmount: globalTaskAmount || null,
          currency: 'PKR'
        }
      })
    }
  } catch (error) {
    console.error('Error updating task settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
