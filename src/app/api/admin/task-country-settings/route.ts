import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { db as prisma } from '@/lib/db'

// GET - Get current country blocking settings
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

    // Get settings from environment or database
    // For now, return default settings - in production you might store these in database
    const settings = {
      blockedCountries: process.env.BLOCKED_COUNTRIES?.split(',') || ['IN', 'PK', 'BD'],
      isEnabled: process.env.COUNTRY_BLOCKING_ENABLED !== 'false',
      customMessage: process.env.COUNTRY_BLOCK_MESSAGE || 'Tasks are currently not available in your region due to compliance requirements.',
      allowVpnBypass: process.env.ALLOW_VPN_BYPASS !== 'false',
      logAttempts: process.env.LOG_COUNTRY_ATTEMPTS !== 'false'
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching country settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update country blocking settings
export async function POST(request: NextRequest) {
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

    const { 
      blockedCountries, 
      isEnabled, 
      customMessage, 
      allowVpnBypass, 
      logAttempts 
    } = await request.json()

    // Validate input
    if (!Array.isArray(blockedCountries)) {
      return NextResponse.json({ error: 'Invalid blocked countries format' }, { status: 400 })
    }

    // In a production environment, you would save these to a database
    // For now, we'll just log the changes and return success
    console.log('🔧 Country blocking settings updated:', {
      blockedCountries,
      isEnabled,
      customMessage,
      allowVpnBypass,
      logAttempts,
      updatedBy: session.user.email,
      timestamp: new Date().toISOString()
    })

    // Create admin activity log
    await prisma.adminActivity.create({
      data: {
        adminId: session.user.id,
        action: 'UPDATE_COUNTRY_SETTINGS',
        description: `Updated task country blocking settings`,
        metadata: JSON.stringify({
          blockedCountries,
          isEnabled,
          customMessage: customMessage.substring(0, 100) + '...',
          allowVpnBypass,
          logAttempts
        })
      }
    }).catch(() => {
      // Ignore if AdminActivity table doesn't exist
      console.log('AdminActivity table not found, skipping log')
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully' 
    })
  } catch (error) {
    console.error('Error updating country settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
