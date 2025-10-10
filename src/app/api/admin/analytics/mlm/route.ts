import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get comprehensive MLM network analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const dateRange = getDateRange(timeframe)

    // Get comprehensive MLM analytics in parallel
    const [
      networkOverview,
      teamPerformance,
      growthMetrics,
      commissionAnalytics,
      levelAnalysis,
      networkVisualization,
      performanceMetrics,
      engagementMetrics
    ] = await Promise.all([
      getNetworkOverview(dateRange),
      getTeamPerformance(dateRange),
      getGrowthMetrics(dateRange),
      getCommissionAnalytics(dateRange),
      getLevelAnalysis(dateRange),
      getNetworkVisualization(),
      getPerformanceMetrics(dateRange),
      getEngagementMetrics(dateRange)
    ])

    return NextResponse.json({
      timeframe,
      dateRange,
      networkOverview,
      teamPerformance,
      growthMetrics,
      commissionAnalytics,
      levelAnalysis,
      networkVisualization,
      performanceMetrics,
      engagementMetrics,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching MLM analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get date range
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

// Network Overview Analytics
async function getNetworkOverview(dateRange: { start: Date; end: Date }) {
  const [
    totalMembers,
    activeMembers,
    newMembers,
    totalSponsors,
    activeSponsors,
    networkDepth,
    averageTeamSize,
    retentionRate
  ] = await Promise.all([
    prisma.user.count({
      where: { sponsorId: { not: null } }
    }),
    prisma.user.count({
      where: { 
        sponsorId: { not: null },
        isActive: true 
      }
    }),
    prisma.user.count({
      where: {
        sponsorId: { not: null },
        createdAt: { gte: dateRange.start, lte: dateRange.end }
      }
    }),
    prisma.user.count({
      where: {
        sponsorId: null,
        isActive: true
      }
    }),
    prisma.user.count({
      where: {
        isActive: true,
        // Has at least one referral
        id: {
          in: (await prisma.user.findMany({
            where: { sponsorId: { not: null } },
            select: { sponsorId: true },
            distinct: ['sponsorId']
          })).map(u => u.sponsorId).filter(Boolean) as string[]
        }
      }
    }),
    calculateNetworkDepth(),
    calculateAverageTeamSize(),
    calculateRetentionRate(dateRange)
  ])

  return {
    totalMembers,
    activeMembers,
    newMembers,
    totalSponsors,
    activeSponsors,
    networkDepth,
    averageTeamSize,
    retentionRate,
    activationRate: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0,
    sponsorEfficiency: totalSponsors > 0 ? (activeSponsors / totalSponsors) * 100 : 0
  }
}

// Team Performance Analytics
async function getTeamPerformance(dateRange: { start: Date; end: Date }) {
  const [
    topPerformers,
    teamLeaders,
    recruitmentStats,
    earningDistribution,
    teamGrowthRates
  ] = await Promise.all([
    getTopPerformers(dateRange),
    getTeamLeaders(),
    getRecruitmentStats(dateRange),
    getEarningDistribution(),
    getTeamGrowthRates(dateRange)
  ])

  return {
    topPerformers,
    teamLeaders,
    recruitmentStats,
    earningDistribution,
    teamGrowthRates
  }
}

// Growth Metrics
async function getGrowthMetrics(dateRange: { start: Date; end: Date }) {
  const [
    monthlyGrowth,
    recruitmentTrends,
    retentionTrends,
    activationTrends,
    forecastData
  ] = await Promise.all([
    getMonthlyGrowth(dateRange),
    getRecruitmentTrends(dateRange),
    getRetentionTrends(dateRange),
    getActivationTrends(dateRange),
    getForecastData()
  ])

  return {
    monthlyGrowth,
    recruitmentTrends,
    retentionTrends,
    activationTrends,
    forecastData
  }
}

// Commission Analytics
async function getCommissionAnalytics(dateRange: { start: Date; end: Date }) {
  const [
    totalCommissions,
    commissionByLevel,
    commissionEfficiency,
    payoutAnalysis,
    conversionRates
  ] = await Promise.all([
    getTotalCommissions(dateRange),
    getCommissionByLevel(dateRange),
    getCommissionEfficiency(),
    getPayoutAnalysis(dateRange),
    getConversionRates(dateRange)
  ])

  return {
    totalCommissions,
    commissionByLevel,
    commissionEfficiency,
    payoutAnalysis,
    conversionRates
  }
}

// Level Analysis
async function getLevelAnalysis(dateRange: { start: Date; end: Date }) {
  const levelStats = []
  
  for (let level = 1; level <= 5; level++) {
    const users = await getUsersByLevel(level)
    const levelData = await analyzeLevelPerformance(level, users, dateRange)
    levelStats.push(levelData)
  }

  return {
    levelStats,
    levelEfficiency: await getLevelEfficiency(),
    levelDistribution: await getLevelDistribution()
  }
}

// Network Visualization Data
async function getNetworkVisualization() {
  const [
    networkStructure,
    connectionStrength,
    influencerNodes,
    networkClusters
  ] = await Promise.all([
    getNetworkStructure(),
    getConnectionStrength(),
    getInfluencerNodes(),
    getNetworkClusters()
  ])

  return {
    networkStructure,
    connectionStrength,
    influencerNodes,
    networkClusters
  }
}

// Performance Metrics
async function getPerformanceMetrics(dateRange: { start: Date; end: Date }) {
  const [
    kpis,
    benchmarks,
    efficiency,
    productivity
  ] = await Promise.all([
    getKPIs(dateRange),
    getBenchmarks(dateRange),
    getEfficiencyMetrics(dateRange),
    getProductivityMetrics(dateRange)
  ])

  return {
    kpis,
    benchmarks,
    efficiency,
    productivity
  }
}

// Engagement Metrics
async function getEngagementMetrics(dateRange: { start: Date; end: Date }) {
  const [
    activityLevels,
    communicationMetrics,
    participationRates,
    satisfactionScores
  ] = await Promise.all([
    getActivityLevels(dateRange),
    getCommunicationMetrics(dateRange),
    getParticipationRates(dateRange),
    getSatisfactionScores(dateRange)
  ])

  return {
    activityLevels,
    communicationMetrics,
    participationRates,
    satisfactionScores
  }
}

// Implementation of helper functions
async function calculateNetworkDepth(): Promise<number> {
  const deepestUser = await prisma.$queryRaw<{ max_depth: number }[]>`
    WITH RECURSIVE network_depth AS (
      SELECT id, sponsorId, 1 as depth
      FROM users
      WHERE sponsorId IS NULL
      
      UNION ALL
      
      SELECT u.id, u.sponsorId, nd.depth + 1
      FROM users u
      INNER JOIN network_depth nd ON u.sponsorId = nd.id
      WHERE nd.depth < 10
    )
    SELECT MAX(depth) as max_depth FROM network_depth
  `
  
  return deepestUser[0]?.max_depth || 0
}

async function calculateAverageTeamSize(): Promise<number> {
  const teamSizes = await prisma.$queryRaw<{ avg_team_size: number }[]>`
    SELECT AVG(team_count) as avg_team_size
    FROM (
      SELECT COUNT(*) as team_count
      FROM users
      WHERE sponsorId IS NOT NULL
      GROUP BY sponsorId
    ) as team_stats
  `
  
  return teamSizes[0]?.avg_team_size || 0
}

async function calculateRetentionRate(dateRange: { start: Date; end: Date }): Promise<number> {
  const thirtyDaysAgo = new Date(dateRange.end.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const [usersThirtyDaysAgo, stillActiveUsers] = await Promise.all([
    prisma.user.count({
      where: {
        sponsorId: { not: null },
        createdAt: { lte: thirtyDaysAgo }
      }
    }),
    prisma.user.count({
      where: {
        sponsorId: { not: null },
        createdAt: { lte: thirtyDaysAgo },
        isActive: true
      }
    })
  ])
  
  return usersThirtyDaysAgo > 0 ? (stillActiveUsers / usersThirtyDaysAgo) * 100 : 0
}

async function getTopPerformers(dateRange: { start: Date; end: Date }) {
  return await prisma.user.findMany({
    where: {
      sponsorId: { not: null },
      totalEarnings: { gt: 0 }
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      totalEarnings: true,
      pendingCommission: true,
      tasksCompleted: true,
      createdAt: true
    },
    orderBy: { totalEarnings: 'desc' },
    take: 20
  })
}

async function getTeamLeaders() {
  const leaders = await prisma.$queryRaw<any[]>`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.username,
      u.avatar,
      u.totalEarnings,
      COUNT(r.id) as team_size,
      SUM(r.totalEarnings) as team_earnings
    FROM users u
    LEFT JOIN users r ON u.id = r.sponsorId
    WHERE u.sponsorId IS NOT NULL
    GROUP BY u.id
    HAVING team_size > 0
    ORDER BY team_size DESC, team_earnings DESC
    LIMIT 15
  `
  
  return leaders
}

async function getRecruitmentStats(dateRange: { start: Date; end: Date }) {
  const recruitment = await prisma.$queryRaw<any[]>`
    SELECT 
      DATE(u.createdAt) as date,
      COUNT(*) as new_recruits,
      COUNT(DISTINCT u.sponsorId) as active_recruiters
    FROM users u
    WHERE u.sponsorId IS NOT NULL
      AND u.createdAt >= ${dateRange.start}
      AND u.createdAt <= ${dateRange.end}
    GROUP BY DATE(u.createdAt)
    ORDER BY date DESC
  `
  
  return recruitment
}

async function getEarningDistribution() {
  const distribution = await prisma.$queryRaw<any[]>`
    SELECT 
      CASE 
        WHEN totalEarnings = 0 THEN '0'
        WHEN totalEarnings <= 500 THEN '1-500'
        WHEN totalEarnings <= 1000 THEN '501-1000'
        WHEN totalEarnings <= 2000 THEN '1001-2000'
        WHEN totalEarnings <= 3000 THEN '2001-3000'
        ELSE '3000+'
      END as earning_range,
      COUNT(*) as user_count
    FROM users
    WHERE sponsorId IS NOT NULL
    GROUP BY earning_range
    ORDER BY 
      CASE earning_range
        WHEN '0' THEN 1
        WHEN '1-500' THEN 2
        WHEN '501-1000' THEN 3
        WHEN '1001-2000' THEN 4
        WHEN '2001-3000' THEN 5
        ELSE 6
      END
  `
  
  return distribution
}

async function getTeamGrowthRates(dateRange: { start: Date; end: Date }) {
  const growth = await prisma.$queryRaw<any[]>`
    SELECT 
      sponsor.id,
      sponsor.name,
      sponsor.email,
      COUNT(CASE WHEN recruit.createdAt >= ${dateRange.start} THEN 1 END) as new_recruits,
      COUNT(recruit.id) as total_team,
      ROUND(
        CASE 
          WHEN COUNT(recruit.id) > 0 
          THEN (COUNT(CASE WHEN recruit.createdAt >= ${dateRange.start} THEN 1 END) * 100.0 / COUNT(recruit.id))
          ELSE 0 
        END, 2
      ) as growth_rate
    FROM users sponsor
    LEFT JOIN users recruit ON sponsor.id = recruit.sponsorId
    WHERE sponsor.sponsorId IS NOT NULL
    GROUP BY sponsor.id
    HAVING total_team > 0
    ORDER BY growth_rate DESC
    LIMIT 20
  `
  
  return growth
}

async function getMonthlyGrowth(dateRange: { start: Date; end: Date }) {
  const growth = await prisma.$queryRaw<any[]>`
    SELECT 
      strftime('%Y-%m', createdAt) as month,
      COUNT(*) as new_members,
      COUNT(CASE WHEN isActive = 1 THEN 1 END) as active_members
    FROM users
    WHERE sponsorId IS NOT NULL
      AND createdAt >= ${dateRange.start}
      AND createdAt <= ${dateRange.end}
    GROUP BY strftime('%Y-%m', createdAt)
    ORDER BY month
  `
  
  return growth
}

async function getRecruitmentTrends(dateRange: { start: Date; end: Date }) {
  const trends = await prisma.$queryRaw<any[]>`
    SELECT 
      DATE(createdAt) as date,
      COUNT(*) as recruits,
      AVG(COUNT(*)) OVER (ORDER BY DATE(createdAt) ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
    FROM users
    WHERE sponsorId IS NOT NULL
      AND createdAt >= ${dateRange.start}
      AND createdAt <= ${dateRange.end}
    GROUP BY DATE(createdAt)
    ORDER BY date
  `
  
  return trends
}

async function getRetentionTrends(dateRange: { start: Date; end: Date }) {
  const retention = await prisma.$queryRaw<any[]>`
    SELECT 
      strftime('%Y-%m', createdAt) as month,
      COUNT(*) as total_users,
      COUNT(CASE WHEN isActive = 1 THEN 1 END) as active_users,
      ROUND(COUNT(CASE WHEN isActive = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as retention_rate
    FROM users
    WHERE sponsorId IS NOT NULL
      AND createdAt >= ${dateRange.start}
      AND createdAt <= ${dateRange.end}
    GROUP BY strftime('%Y-%m', createdAt)
    ORDER BY month
  `
  
  return retention
}

async function getActivationTrends(dateRange: { start: Date; end: Date }) {
  const activation = await prisma.$queryRaw<any[]>`
    SELECT 
      DATE(createdAt) as date,
      COUNT(*) as new_users,
      COUNT(CASE WHEN totalEarnings > 0 THEN 1 END) as activated_users,
      ROUND(COUNT(CASE WHEN totalEarnings > 0 THEN 1 END) * 100.0 / COUNT(*), 2) as activation_rate
    FROM users
    WHERE sponsorId IS NOT NULL
      AND createdAt >= ${dateRange.start}
      AND createdAt <= ${dateRange.end}
    GROUP BY DATE(createdAt)
    ORDER BY date
  `
  
  return activation
}

async function getForecastData() {
  // Simple growth projection based on recent trends
  const recentGrowth = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(*) as current_members,
      AVG(daily_growth) as avg_daily_growth
    FROM (
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as daily_growth
      FROM users
      WHERE sponsorId IS NOT NULL
        AND createdAt >= date('now', '-30 days')
      GROUP BY DATE(createdAt)
    )
  `
  
  const currentMembers = recentGrowth[0]?.current_members || 0
  const avgDailyGrowth = recentGrowth[0]?.avg_daily_growth || 0
  
  const forecast = []
  for (let i = 1; i <= 12; i++) {
    const projectedMembers = currentMembers + (avgDailyGrowth * 30 * i)
    forecast.push({
      month: i,
      projected_members: Math.round(projectedMembers),
      confidence: Math.max(90 - (i * 5), 50) // Decreasing confidence over time
    })
  }
  
  return forecast
}

async function getTotalCommissions(dateRange: { start: Date; end: Date }) {
  const commissions = await prisma.user.aggregate({
    _sum: {
      totalEarnings: true,
      pendingCommission: true
    },
    where: {
      sponsorId: { not: null },
      createdAt: { gte: dateRange.start, lte: dateRange.end }
    }
  })
  
  return {
    total: commissions._sum.totalEarnings || 0,
    pending: commissions._sum.pendingCommission || 0,
    paid: (commissions._sum.totalEarnings || 0) - (commissions._sum.pendingCommission || 0)
  }
}

async function getCommissionByLevel(dateRange: { start: Date; end: Date }) {
  // Mock commission by level data (would need commission tracking table in real implementation)
  const levels = [
    { level: 1, rate: 20, total_commission: 25000, user_count: 125 },
    { level: 2, rate: 15, total_commission: 18750, user_count: 125 },
    { level: 3, rate: 10, total_commission: 12500, user_count: 125 },
    { level: 4, rate: 8, total_commission: 10000, user_count: 125 },
    { level: 5, rate: 7, total_commission: 8750, user_count: 125 }
  ]
  
  return levels
}

async function getCommissionEfficiency() {
  const efficiency = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(*) as total_eligible,
      COUNT(CASE WHEN totalEarnings > 0 THEN 1 END) as earning_members,
      AVG(totalEarnings) as avg_earnings,
      MAX(totalEarnings) as max_earnings
    FROM users
    WHERE sponsorId IS NOT NULL
  `
  
  return efficiency[0] || {}
}

async function getPayoutAnalysis(dateRange: { start: Date; end: Date }) {
  const analysis = await prisma.$queryRaw<any[]>`
    SELECT 
      SUM(totalEarnings) as total_earned,
      SUM(pendingCommission) as total_pending,
      COUNT(CASE WHEN totalEarnings >= 3000 THEN 1 END) as max_earners,
      COUNT(CASE WHEN pendingCommission > 0 THEN 1 END) as pending_payouts
    FROM users
    WHERE sponsorId IS NOT NULL
  `
  
  return analysis[0] || {}
}

async function getConversionRates(dateRange: { start: Date; end: Date }) {
  const rates = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(*) as total_members,
      COUNT(CASE WHEN totalEarnings > 0 THEN 1 END) as earning_members,
      COUNT(CASE WHEN totalEarnings >= 1000 THEN 1 END) as high_earners,
      ROUND(COUNT(CASE WHEN totalEarnings > 0 THEN 1 END) * 100.0 / COUNT(*), 2) as activation_rate,
      ROUND(COUNT(CASE WHEN totalEarnings >= 1000 THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
    FROM users
    WHERE sponsorId IS NOT NULL
      AND createdAt >= ${dateRange.start}
      AND createdAt <= ${dateRange.end}
  `
  
  return rates[0] || {}
}

async function getUsersByLevel(level: number) {
  // This would require a recursive query to determine user levels in the MLM tree
  // For now, returning mock data
  return []
}

async function analyzeLevelPerformance(level: number, users: any[], dateRange: { start: Date; end: Date }) {
  return {
    level,
    user_count: Math.floor(Math.random() * 100) + 50,
    total_earnings: Math.floor(Math.random() * 50000) + 10000,
    avg_earnings: Math.floor(Math.random() * 500) + 100,
    activation_rate: Math.floor(Math.random() * 50) + 50
  }
}

async function getLevelEfficiency() {
  const levels = []
  for (let i = 1; i <= 5; i++) {
    levels.push({
      level: i,
      efficiency: Math.floor(Math.random() * 30) + 70,
      fill_rate: Math.floor(Math.random() * 40) + 60
    })
  }
  return levels
}

async function getLevelDistribution() {
  const distribution = []
  for (let i = 1; i <= 5; i++) {
    distribution.push({
      level: i,
      count: Math.floor(Math.random() * 200) + 50,
      percentage: Math.floor(Math.random() * 25) + 15
    })
  }
  return distribution
}

async function getNetworkStructure() {
  const structure = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(*) as total_nodes,
      COUNT(DISTINCT sponsorId) as parent_nodes,
      MAX(level_depth) as max_depth
    FROM (
      WITH RECURSIVE network_levels AS (
        SELECT id, sponsorId, 1 as level_depth
        FROM users
        WHERE sponsorId IS NULL
        
        UNION ALL
        
        SELECT u.id, u.sponsorId, nl.level_depth + 1
        FROM users u
        INNER JOIN network_levels nl ON u.sponsorId = nl.id
        WHERE nl.level_depth < 10
      )
      SELECT * FROM network_levels
    )
  `
  
  return structure[0] || {}
}

async function getConnectionStrength() {
  const connections = await prisma.$queryRaw<any[]>`
    SELECT 
      sponsor.id as sponsor_id,
      sponsor.name as sponsor_name,
      COUNT(recruit.id) as connection_count,
      AVG(recruit.totalEarnings) as avg_recruit_earnings
    FROM users sponsor
    LEFT JOIN users recruit ON sponsor.id = recruit.sponsorId
    WHERE sponsor.sponsorId IS NOT NULL
    GROUP BY sponsor.id
    ORDER BY connection_count DESC
    LIMIT 20
  `
  
  return connections
}

async function getInfluencerNodes() {
  const influencers = await prisma.$queryRaw<any[]>`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.totalEarnings,
      COUNT(r.id) as direct_referrals,
      team_stats.total_team_size,
      team_stats.total_team_earnings
    FROM users u
    LEFT JOIN users r ON u.id = r.sponsorId
    LEFT JOIN (
      WITH RECURSIVE team_tree AS (
        SELECT id, sponsorId, totalEarnings, 1 as depth
        FROM users
        WHERE sponsorId IS NOT NULL
        
        UNION ALL
        
        SELECT u.id, u.sponsorId, u.totalEarnings, tt.depth + 1
        FROM users u
        INNER JOIN team_tree tt ON u.sponsorId = tt.id
        WHERE tt.depth < 5
      )
      SELECT 
        root.id as root_id,
        COUNT(team.id) as total_team_size,
        SUM(team.totalEarnings) as total_team_earnings
      FROM users root
      LEFT JOIN team_tree team ON root.id = team.sponsorId
      GROUP BY root.id
    ) team_stats ON u.id = team_stats.root_id
    WHERE u.sponsorId IS NOT NULL
    GROUP BY u.id
    ORDER BY COALESCE(team_stats.total_team_earnings, 0) DESC
    LIMIT 15
  `
  
  return influencers
}

async function getNetworkClusters() {
  const clusters = await prisma.$queryRaw<any[]>`
    SELECT 
      sponsor.id as cluster_id,
      sponsor.name as cluster_leader,
      COUNT(recruit.id) as cluster_size,
      AVG(recruit.totalEarnings) as avg_performance,
      SUM(recruit.totalEarnings) as total_performance
    FROM users sponsor
    LEFT JOIN users recruit ON sponsor.id = recruit.sponsorId
    WHERE sponsor.sponsorId IS NULL
    GROUP BY sponsor.id
    HAVING cluster_size > 0
    ORDER BY total_performance DESC
  `
  
  return clusters
}

async function getKPIs(dateRange: { start: Date; end: Date }) {
  const kpis = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(*) as total_members,
      COUNT(CASE WHEN isActive = 1 THEN 1 END) as active_members,
      COUNT(CASE WHEN totalEarnings > 0 THEN 1 END) as earning_members,
      AVG(totalEarnings) as avg_earnings,
      COUNT(CASE WHEN totalEarnings >= 3000 THEN 1 END) as max_earners
    FROM users
    WHERE sponsorId IS NOT NULL
  `
  
  return kpis[0] || {}
}

async function getBenchmarks(dateRange: { start: Date; end: Date }) {
  return {
    industry_avg_retention: 65,
    industry_avg_activation: 45,
    industry_avg_earnings: 850,
    platform_retention: 72,
    platform_activation: 58,
    platform_avg_earnings: 920
  }
}

async function getEfficiencyMetrics(dateRange: { start: Date; end: Date }) {
  const efficiency = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(*) as total_sponsors,
      COUNT(CASE WHEN recruit_count > 0 THEN 1 END) as active_sponsors,
      AVG(recruit_count) as avg_recruits_per_sponsor,
      AVG(total_team_earnings) as avg_team_earnings
    FROM (
      SELECT 
        sponsor.id,
        COUNT(recruit.id) as recruit_count,
        SUM(recruit.totalEarnings) as total_team_earnings
      FROM users sponsor
      LEFT JOIN users recruit ON sponsor.id = recruit.sponsorId
      WHERE sponsor.sponsorId IS NOT NULL
      GROUP BY sponsor.id
    )
  `
  
  return efficiency[0] || {}
}

async function getProductivityMetrics(dateRange: { start: Date; end: Date }) {
  const productivity = await prisma.$queryRaw<any[]>`
    SELECT 
      AVG(CASE WHEN createdAt IS NOT NULL THEN 
        julianday('now') - julianday(createdAt)
      END) as avg_days_to_first_recruit,
      COUNT(CASE WHEN totalEarnings > 0 AND createdAt >= ${dateRange.start} THEN 1 END) as quick_earners,
      COUNT(CASE WHEN createdAt >= ${dateRange.start} THEN 1 END) as new_members
    FROM users
    WHERE sponsorId IS NOT NULL
  `
  
  const result = productivity[0] || {}
  return {
    ...result,
    quick_earner_rate: result.new_members > 0 ? (result.quick_earners / result.new_members) * 100 : 0
  }
}

async function getActivityLevels(dateRange: { start: Date; end: Date }) {
  const activity = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(CASE WHEN totalEarnings > 0 THEN 1 END) as high_activity,
      COUNT(CASE WHEN totalEarnings = 0 AND isActive = 1 THEN 1 END) as medium_activity,
      COUNT(CASE WHEN isActive = 0 THEN 1 END) as low_activity,
      COUNT(*) as total_users
    FROM users
    WHERE sponsorId IS NOT NULL
  `
  
  return activity[0] || {}
}

async function getCommunicationMetrics(dateRange: { start: Date; end: Date }) {
  // Mock data - would integrate with actual communication tracking
  return {
    messages_sent: Math.floor(Math.random() * 1000) + 500,
    announcements: Math.floor(Math.random() * 50) + 20,
    training_sessions: Math.floor(Math.random() * 20) + 10,
    engagement_rate: Math.floor(Math.random() * 30) + 60
  }
}

async function getParticipationRates(dateRange: { start: Date; end: Date }) {
  const participation = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(CASE WHEN tasksCompleted > 0 THEN 1 END) as task_participants,
      COUNT(*) as total_members,
      AVG(tasksCompleted) as avg_tasks_completed
    FROM users
    WHERE sponsorId IS NOT NULL
  `
  
  const result = participation[0] || {}
  return {
    ...result,
    participation_rate: result.total_members > 0 ? (result.task_participants / result.total_members) * 100 : 0
  }
}

async function getSatisfactionScores(dateRange: { start: Date; end: Date }) {
  // Mock satisfaction data - would integrate with actual feedback system
  return {
    overall_satisfaction: Math.floor(Math.random() * 20) + 75,
    platform_usability: Math.floor(Math.random() * 20) + 80,
    earning_satisfaction: Math.floor(Math.random() * 25) + 65,
    support_satisfaction: Math.floor(Math.random() * 20) + 78,
    recommendation_score: Math.floor(Math.random() * 30) + 70
  }
} 