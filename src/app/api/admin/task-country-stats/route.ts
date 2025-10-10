import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { db as prisma } from '@/lib/db'

// GET - Get country blocking statistics
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Mock statistics for now - in production you would track these in database
    const mockStats = [
      {
        country: 'IN',
        countryName: 'India',
        blockedAttempts: 45,
        lastAttempt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        country: 'PK',
        countryName: 'Pakistan',
        blockedAttempts: 23,
        lastAttempt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        country: 'BD',
        countryName: 'Bangladesh',
        blockedAttempts: 12,
        lastAttempt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
      }
    ]

    return NextResponse.json({
      stats: mockStats,
      totalBlocked: mockStats.reduce((sum, stat) => sum + stat.blockedAttempts, 0),
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching country stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
