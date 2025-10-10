import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface ScheduledReport {
  id: string
  title: string
  description?: string
  type: string
  format: string
  timeframe: string
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    day?: number // For weekly (0-6) or monthly (1-31)
    time: string // HH:MM format
    timezone: string
  }
  recipients: string[]
  filters?: Record<string, any>
  isActive: boolean
  createdAt: string
  createdBy: string
  lastGenerated?: string
  nextGeneration: string
}

// GET - Get scheduled reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock scheduled reports data
    const scheduledReports: ScheduledReport[] = [
      {
        id: '1',
        title: 'Weekly Analytics Summary',
        description: 'Comprehensive weekly performance report',
        type: 'analytics',
        format: 'pdf',
        timeframe: '7d',
        schedule: {
          frequency: 'weekly',
          day: 1, // Monday
          time: '09:00',
          timezone: 'Asia/Karachi'
        },
        recipients: ['admin@mlmpak.com', 'manager@mlmpak.com'],
        isActive: true,
        createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        createdBy: 'Admin',
        lastGenerated: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
        nextGeneration: getNextGeneration('weekly', 1, '09:00')
      },
      {
        id: '2',
        title: 'Monthly Financial Report',
        description: 'Monthly revenue, expenses, and profitability analysis',
        type: 'financial',
        format: 'excel',
        timeframe: '30d',
        schedule: {
          frequency: 'monthly',
          day: 1, // 1st of each month
          time: '08:00',
          timezone: 'Asia/Karachi'
        },
        recipients: ['finance@mlmpak.com', 'admin@mlmpak.com'],
        isActive: true,
        createdAt: new Date(Date.now() - 5184000000).toISOString(), // 60 days ago
        createdBy: 'Admin',
        lastGenerated: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        nextGeneration: getNextGeneration('monthly', 1, '08:00')
      },
      {
        id: '3',
        title: 'Daily Task Summary',
        description: 'Daily task completion and user engagement metrics',
        type: 'tasks',
        format: 'csv',
        timeframe: '1d',
        schedule: {
          frequency: 'daily',
          time: '23:30',
          timezone: 'Asia/Karachi'
        },
        recipients: ['operations@mlmpak.com'],
        isActive: false,
        createdAt: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
        createdBy: 'Operations Manager',
        lastGenerated: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
        nextGeneration: 'Paused'
      }
    ]

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    let filteredReports = scheduledReports
    if (status === 'active') {
      filteredReports = scheduledReports.filter(r => r.isActive)
    } else if (status === 'inactive') {
      filteredReports = scheduledReports.filter(r => !r.isActive)
    }

    const stats = {
      total: scheduledReports.length,
      active: scheduledReports.filter(r => r.isActive).length,
      inactive: scheduledReports.filter(r => !r.isActive).length,
      dailyReports: scheduledReports.filter(r => r.schedule.frequency === 'daily').length,
      weeklyReports: scheduledReports.filter(r => r.schedule.frequency === 'weekly').length,
      monthlyReports: scheduledReports.filter(r => r.schedule.frequency === 'monthly').length
    }

    return NextResponse.json({
      scheduledReports: filteredReports,
      stats
    })

  } catch (error) {
    console.error('Error fetching scheduled reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new scheduled report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      format,
      timeframe,
      schedule,
      recipients,
      filters = {}
    } = body

    // Validate required fields
    if (!title || !type || !format || !timeframe || !schedule || !recipients?.length) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, type, format, timeframe, schedule, recipients' 
      }, { status: 400 })
    }

    // Validate schedule
    if (!schedule.frequency || !schedule.time) {
      return NextResponse.json({ 
        error: 'Invalid schedule: frequency and time are required' 
      }, { status: 400 })
    }

    // Validate recipients
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!recipients.every((email: string) => emailRegex.test(email))) {
      return NextResponse.json({ 
        error: 'Invalid email addresses in recipients' 
      }, { status: 400 })
    }

    const newScheduledReport: ScheduledReport = {
      id: Date.now().toString(),
      title,
      description,
      type,
      format,
      timeframe,
      schedule: {
        ...schedule,
        timezone: schedule.timezone || 'Asia/Karachi'
      },
      recipients,
      filters,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: session.user.name || 'Admin',
      nextGeneration: calculateNextGeneration(schedule)
    }

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Set up the actual scheduled job (using cron, agenda, etc.)
    // 3. Send confirmation email to recipients

    return NextResponse.json({
      message: 'Scheduled report created successfully',
      scheduledReport: newScheduledReport
    })

  } catch (error) {
    console.error('Error creating scheduled report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update scheduled report
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Find and update the scheduled report in database
    // 2. Update the scheduled job
    // 3. Recalculate next generation time if schedule changed

    return NextResponse.json({
      message: 'Scheduled report updated successfully',
      reportId: id
    })

  } catch (error) {
    console.error('Error updating scheduled report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function getNextGeneration(frequency: string, day?: number, time?: string): string {
  const now = new Date()
  const nextDate = new Date(now)

  switch (frequency) {
    case 'daily':
      nextDate.setDate(now.getDate() + 1)
      break
    case 'weekly':
      const daysUntilTarget = ((day || 1) - now.getDay() + 7) % 7 || 7
      nextDate.setDate(now.getDate() + daysUntilTarget)
      break
    case 'monthly':
      nextDate.setMonth(now.getMonth() + 1)
      nextDate.setDate(day || 1)
      break
    case 'quarterly':
      nextDate.setMonth(now.getMonth() + 3)
      nextDate.setDate(1)
      break
  }

  if (time) {
    const [hours, minutes] = time.split(':').map(Number)
    nextDate.setHours(hours, minutes, 0, 0)
  }

  return nextDate.toISOString()
}

function calculateNextGeneration(schedule: any): string {
  return getNextGeneration(schedule.frequency, schedule.day, schedule.time)
} 