import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { db as prisma } from '@/lib/db'

// GET - Get comprehensive user analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const userSegment = searchParams.get('segment') || 'all'
    const sortBy = searchParams.get('sortBy') || 'activity'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const dateRange = getDateRange(timeframe)

    // Get comprehensive user analytics
    const [
      userOverview,
      userSegmentation,
      engagementMetrics,
      behaviorPatterns,
      performanceMetrics,
      userLifecycle,
      detailedUsers,
      retentionAnalysis
    ] = await Promise.all([
      getUserOverview(dateRange),
      getUserSegmentation(dateRange),
      getEngagementMetrics(dateRange),
      getBehaviorPatterns(dateRange),
      getPerformanceMetrics(dateRange),
      getUserLifecycle(dateRange),
      getDetailedUsers(dateRange, userSegment, sortBy, skip, limit),
      getRetentionAnalysis(dateRange)
    ])

    return NextResponse.json({
      timeframe,
      dateRange,
      userOverview,
      userSegmentation,
      engagementMetrics,
      behaviorPatterns,
      performanceMetrics,
      userLifecycle,
      detailedUsers,
      retentionAnalysis,
      pagination: {
        page,
        limit,
        total: detailedUsers.total,
        totalPages: Math.ceil(detailedUsers.total / limit)
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function getDateRange(timeframe: string) {
  const now = new Date()
  const start = new Date()
  
  switch (timeframe) {
    case '7d':
      start.setDate(now.getDate() - 7)
      break
    case '30d':
      start.setDate(now.getDate() - 30)
      break
    case '90d':
      start.setDate(now.getDate() - 90)
      break
    case '1y':
      start.setFullYear(now.getFullYear() - 1)
      break
    default:
      start.setDate(now.getDate() - 30)
  }
  
  return { start, end: now }
}

async function getUserOverview(dateRange: { start: Date; end: Date }) {
  const [
    totalUsers,
    newUsers,
    activeUsers,
    inactiveUsers,
    premiumUsers,
    userGrowth,
    averageAge,
    genderDistribution
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.user.count({
      where: {
        isActive: true,
        updatedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    prisma.user.count({
      where: { isActive: false }
    }),
    prisma.user.count({
      where: { role: 'PREMIUM' }
    }),
    getUserGrowthTrend(dateRange),
    calculateAverageUserAge(),
    getUserGenderDistribution()
  ])

  return {
    totalUsers,
    newUsers,
    activeUsers,
    inactiveUsers,
    premiumUsers,
    userGrowth,
    averageAge,
    genderDistribution,
    retentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
    churnRate: totalUsers > 0 ? (inactiveUsers / totalUsers) * 100 : 0
  }
}

async function getUserSegmentation(dateRange: { start: Date; end: Date }) {
  const [
    byRole,
    byActivity,
    byEarnings,
    byRegion,
    byJoinDate,
    bySponsorStatus
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    }),
    getActivitySegmentation(dateRange),
    getEarningsSegmentation(),
    getRegionSegmentation(),
    getJoinDateSegmentation(dateRange),
    getSponsorStatusSegmentation()
  ])

  return {
    byRole,
    byActivity,
    byEarnings,
    byRegion,
    byJoinDate,
    bySponsorStatus
  }
}

async function getEngagementMetrics(dateRange: { start: Date; end: Date }) {
  const [
    loginFrequency,
    sessionDuration,
    pageViews,
    taskEngagement,
    blogEngagement,
    productEngagement,
    socialEngagement
  ] = await Promise.all([
    getLoginFrequency(dateRange),
    getSessionDuration(dateRange),
    getPageViewMetrics(dateRange),
    getTaskEngagementMetrics(dateRange),
    getBlogEngagementMetrics(dateRange),
    getProductEngagementMetrics(dateRange),
    getSocialEngagementMetrics(dateRange)
  ])

  return {
    loginFrequency,
    sessionDuration,
    pageViews,
    taskEngagement,
    blogEngagement,
    productEngagement,
    socialEngagement
  }
}

async function getBehaviorPatterns(dateRange: { start: Date; end: Date }) {
  const [
    peakActivityHours,
    commonUserJourneys,
    dropoffPoints,
    conversionFunnels,
    featureUsage,
    devicePreferences
  ] = await Promise.all([
    getPeakActivityHours(dateRange),
    getCommonUserJourneys(dateRange),
    getDropoffPoints(dateRange),
    getConversionFunnels(dateRange),
    getFeatureUsage(dateRange),
    getDevicePreferences(dateRange)
  ])

  return {
    peakActivityHours,
    commonUserJourneys,
    dropoffPoints,
    conversionFunnels,
    featureUsage,
    devicePreferences
  }
}

async function getPerformanceMetrics(dateRange: { start: Date; end: Date }) {
  const [
    topPerformers,
    earningDistribution,
    taskCompletion,
    referralPerformance,
    networkGrowth,
    achievementMetrics
  ] = await Promise.all([
    getTopPerformers(dateRange),
    getEarningDistribution(),
    getTaskCompletionMetrics(dateRange),
    getReferralPerformance(dateRange),
    getNetworkGrowthMetrics(dateRange),
    getAchievementMetrics(dateRange)
  ])

  return {
    topPerformers,
    earningDistribution,
    taskCompletion,
    referralPerformance,
    networkGrowth,
    achievementMetrics
  }
}

async function getUserLifecycle(dateRange: { start: Date; end: Date }) {
  const [
    newUserOnboarding,
    userActivation,
    retentionRates,
    lifecycleStages,
    churnPrediction
  ] = await Promise.all([
    getNewUserOnboarding(dateRange),
    getUserActivation(dateRange),
    getRetentionRates(dateRange),
    getLifecycleStages(),
    getChurnPrediction(dateRange)
  ])

  return {
    newUserOnboarding,
    userActivation,
    retentionRates,
    lifecycleStages,
    churnPrediction
  }
}

async function getDetailedUsers(
  dateRange: { start: Date; end: Date }, 
  segment: string, 
  sortBy: string, 
  skip: number, 
  limit: number
) {
  let orderBy: any = { updatedAt: 'desc' }
  let where: any = {}

  // Apply sorting
  switch (sortBy) {
    case 'earnings':
      orderBy = { totalEarnings: 'desc' }
      break
    case 'tasks':
      orderBy = { tasksCompleted: 'desc' }
      break
    case 'points':
      orderBy = { totalPoints: 'desc' }
      break
    case 'recent':
      orderBy = { createdAt: 'desc' }
      break
    default:
      orderBy = { updatedAt: 'desc' }
  }

  // Apply segmentation filters
  switch (segment) {
    case 'new':
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end
      }
      break
    case 'active':
      where.isActive = true
      where.updatedAt = {
        gte: dateRange.start,
        lte: dateRange.end
      }
      break
    case 'inactive':
      where.isActive = false
      break
    case 'high_earners':
      where.totalEarnings = { gte: 1000 }
      break
    case 'sponsors':
      where.sponsorId = { not: null }
      break
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        role: true,
        isActive: true,
        isAdmin: true,
        totalEarnings: true,
        totalPoints: true,
        tasksCompleted: true,
        balance: true,
        pendingCommission: true,
        sponsorId: true,
        createdAt: true,
        updatedAt: true,
        // Include engagement metrics
        orders: {
          select: { id: true, totalPkr: true, status: true },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        taskCompletions: {
          select: { id: true, status: true, reward: true, completedAt: true },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    }),
    prisma.user.count({ where })
  ])

  // Enrich users with calculated metrics
  const enrichedUsers = users.map(user => ({
    ...user,
    totalOrders: user.orders.length,
    totalOrderValue: user.orders.reduce((sum, order) => sum + order.totalPkr, 0),
    completedTasks: user.taskCompletions.filter(tc => tc.status === 'COMPLETED').length,
    totalTaskRewards: user.taskCompletions
      .filter(tc => tc.status === 'COMPLETED')
      .reduce((sum, tc) => sum + tc.reward, 0),
    lastActivity: user.updatedAt,
    accountAge: Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    engagementScore: calculateEngagementScore(user)
  }))

  return {
    users: enrichedUsers,
    total
  }
}

async function getRetentionAnalysis(dateRange: { start: Date; end: Date }) {
  // Cohort analysis and retention metrics
  const cohortData = await getCohortAnalysis(dateRange)
  const retentionBySegment = await getRetentionBySegment(dateRange)
  const churnAnalysis = await getChurnAnalysis(dateRange)

  return {
    cohortData,
    retentionBySegment,
    churnAnalysis
  }
}

// Helper implementations (simplified for brevity)
async function getUserGrowthTrend(dateRange: { start: Date; end: Date }) {
  // Implementation for user growth trend analysis
  return {
    daily: [],
    weekly: [],
    monthly: []
  }
}

async function calculateAverageUserAge() {
  const users = await prisma.user.findMany({
    select: { createdAt: true }
  })
  
  const totalAge = users.reduce((sum, user) => {
    const age = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    return sum + age
  }, 0)
  
  return users.length > 0 ? Math.floor(totalAge / users.length) : 0
}

async function getUserGenderDistribution() {
  // Placeholder - would need gender field in user model
  return {
    male: 45,
    female: 40,
    other: 10,
    notSpecified: 5
  }
}

async function getActivitySegmentation(dateRange: { start: Date; end: Date }) {
  const [highlyActive, moderatelyActive, lowActivity, inactive] = await Promise.all([
    prisma.user.count({
      where: {
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        tasksCompleted: { gte: 10 }
      }
    }),
    prisma.user.count({
      where: {
        updatedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        tasksCompleted: { gte: 5, lt: 10 }
      }
    }),
    prisma.user.count({
      where: {
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        tasksCompleted: { gte: 1, lt: 5 }
      }
    }),
    prisma.user.count({
      where: {
        updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    })
  ])

  return [
    { segment: 'Highly Active', count: highlyActive },
    { segment: 'Moderately Active', count: moderatelyActive },
    { segment: 'Low Activity', count: lowActivity },
    { segment: 'Inactive', count: inactive }
  ]
}

async function getEarningsSegmentation() {
  const [highEarners, mediumEarners, lowEarners, noEarnings] = await Promise.all([
    prisma.user.count({ where: { totalEarnings: { gte: 5000 } } }),
    prisma.user.count({ where: { totalEarnings: { gte: 1000, lt: 5000 } } }),
    prisma.user.count({ where: { totalEarnings: { gte: 100, lt: 1000 } } }),
    prisma.user.count({ where: { totalEarnings: { lt: 100 } } })
  ])

  return [
    { segment: 'High Earners (5000+)', count: highEarners },
    { segment: 'Medium Earners (1000-5000)', count: mediumEarners },
    { segment: 'Low Earners (100-1000)', count: lowEarners },
    { segment: 'No Earnings (<100)', count: noEarnings }
  ]
}

function calculateEngagementScore(user: any): number {
  let score = 0
  
  // Task completion contributes 40%
  score += (user.tasksCompleted || 0) * 0.4
  
  // Order activity contributes 30%
  score += (user.orders?.length || 0) * 3
  
  // Points contribute 20%
  score += ((user.totalPoints || 0) / 100) * 0.2
  
  // Recent activity contributes 10%
  const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(user.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
  score += Math.max(0, (30 - daysSinceUpdate)) * 0.1
  
  return Math.min(100, Math.max(0, score))
}

// Placeholder implementations for additional metrics
async function getRegionSegmentation() { return [] }
async function getJoinDateSegmentation(dateRange: any) { return [] }
async function getSponsorStatusSegmentation() { return [] }
async function getLoginFrequency(dateRange: any) { return {} }
async function getSessionDuration(dateRange: any) { return {} }
async function getPageViewMetrics(dateRange: any) { return {} }
async function getTaskEngagementMetrics(dateRange: any) { return {} }
async function getBlogEngagementMetrics(dateRange: any) { return {} }
async function getProductEngagementMetrics(dateRange: any) { return {} }
async function getSocialEngagementMetrics(dateRange: any) { return {} }
async function getPeakActivityHours(dateRange: any) { return [] }
async function getCommonUserJourneys(dateRange: any) { return [] }
async function getDropoffPoints(dateRange: any) { return [] }
async function getConversionFunnels(dateRange: any) { return [] }
async function getFeatureUsage(dateRange: any) { return {} }
async function getDevicePreferences(dateRange: any) { return {} }
async function getTopPerformers(dateRange: any) { return [] }
async function getEarningDistribution() { return {} }
async function getTaskCompletionMetrics(dateRange: any) { return {} }
async function getReferralPerformance(dateRange: any) { return {} }
async function getNetworkGrowthMetrics(dateRange: any) { return {} }
async function getAchievementMetrics(dateRange: any) { return {} }
async function getNewUserOnboarding(dateRange: any) { return {} }
async function getUserActivation(dateRange: any) { return {} }
async function getRetentionRates(dateRange: any) { return {} }
async function getLifecycleStages() { return {} }
async function getChurnPrediction(dateRange: any) { return {} }
async function getCohortAnalysis(dateRange: any) { return {} }
async function getRetentionBySegment(dateRange: any) { return {} }
async function getChurnAnalysis(dateRange: any) { return {} } 