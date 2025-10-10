import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id }
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id
        }
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      emailEnabled,
      emailNewMessages,
      emailCommissions,
      emailReferrals,
      emailTasks,
      emailOrders,
      emailBlog,
      emailPromotions,
      pushEnabled,
      pushNewMessages,
      pushCommissions,
      pushReferrals,
      pushTasks,
      pushOrders,
      pushBlog,
      inAppEnabled,
      inAppSounds,
      inAppDesktop,
      digestFrequency,
      quietHoursStart,
      quietHoursEnd,
      timezone,
      groupSimilar,
      maxDailyNotifications
    } = body

    // Update or create preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {
        emailEnabled: emailEnabled ?? undefined,
        emailNewMessages: emailNewMessages ?? undefined,
        emailCommissions: emailCommissions ?? undefined,
        emailReferrals: emailReferrals ?? undefined,
        emailTasks: emailTasks ?? undefined,
        emailOrders: emailOrders ?? undefined,
        emailBlog: emailBlog ?? undefined,
        emailPromotions: emailPromotions ?? undefined,
        pushEnabled: pushEnabled ?? undefined,
        pushNewMessages: pushNewMessages ?? undefined,
        pushCommissions: pushCommissions ?? undefined,
        pushReferrals: pushReferrals ?? undefined,
        pushTasks: pushTasks ?? undefined,
        pushOrders: pushOrders ?? undefined,
        pushBlog: pushBlog ?? undefined,
        inAppEnabled: inAppEnabled ?? undefined,
        inAppSounds: inAppSounds ?? undefined,
        inAppDesktop: inAppDesktop ?? undefined,
        digestFrequency: digestFrequency ?? undefined,
        quietHoursStart: quietHoursStart ?? undefined,
        quietHoursEnd: quietHoursEnd ?? undefined,
        timezone: timezone ?? undefined,
        groupSimilar: groupSimilar ?? undefined,
        maxDailyNotifications: maxDailyNotifications ?? undefined
      },
      create: {
        userId: session.user.id,
        emailEnabled: emailEnabled ?? true,
        emailNewMessages: emailNewMessages ?? true,
        emailCommissions: emailCommissions ?? true,
        emailReferrals: emailReferrals ?? true,
        emailTasks: emailTasks ?? true,
        emailOrders: emailOrders ?? true,
        emailBlog: emailBlog ?? false,
        emailPromotions: emailPromotions ?? false,
        pushEnabled: pushEnabled ?? true,
        pushNewMessages: pushNewMessages ?? true,
        pushCommissions: pushCommissions ?? true,
        pushReferrals: pushReferrals ?? true,
        pushTasks: pushTasks ?? true,
        pushOrders: pushOrders ?? true,
        pushBlog: pushBlog ?? false,
        inAppEnabled: inAppEnabled ?? true,
        inAppSounds: inAppSounds ?? true,
        inAppDesktop: inAppDesktop ?? true,
        digestFrequency: digestFrequency ?? 'daily',
        quietHoursStart: quietHoursStart ?? null,
        quietHoursEnd: quietHoursEnd ?? null,
        timezone: timezone ?? 'Asia/Karachi',
        groupSimilar: groupSimilar ?? true,
        maxDailyNotifications: maxDailyNotifications ?? 50
      }
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 