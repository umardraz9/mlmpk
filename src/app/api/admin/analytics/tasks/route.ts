import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const category = searchParams.get('category') || 'all'
    const difficulty = searchParams.get('difficulty') || 'all'

    // Calculate date range
    const now = new Date()
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))

    // Build filters
    const taskFilter: any = {}
    if (category !== 'all') taskFilter.category = category
    if (difficulty !== 'all') taskFilter.difficulty = difficulty

    const completionFilter: any = {
      createdAt: { gte: startDate }
    }

    // Parallel data fetching for performance
    const [
      // Task Overview
      totalTasks,
      activeTasks,
      archivedTasks,
      tasksByCategory,
      tasksByDifficulty,
      
      // Completion Analytics
      totalCompletions,
      completedTasks,
      inProgressTasks,
      failedTasks,
      pendingApproval,
      avgCompletionTime,
      
      // Engagement Metrics
      uniqueParticipants,
      totalAttempts,
      recentActivity,
      topPerformers,
      
      // Reward Analytics
      totalRewardsDistributed,
      avgRewardPerTask,
      rewardsByCategory,
      
      // Performance Data
      tasksWithCompletions,
      completionTrends,
      categoryPerformance
    ] = await Promise.all([
      // Task Overview
      prisma.task.count({ where: taskFilter }),
      prisma.task.count({ where: { ...taskFilter, status: 'ACTIVE' } }),
      prisma.task.count({ where: { ...taskFilter, status: 'ARCHIVED' } }),
      prisma.task.groupBy({
        by: ['category'],
        where: taskFilter,
        _count: true,
        orderBy: { _count: { category: 'desc' } }
      }),
      prisma.task.groupBy({
        by: ['difficulty'],
        where: taskFilter,
        _count: true,
        orderBy: { _count: { difficulty: 'desc' } }
      }),

      // Completion Analytics
      prisma.taskCompletion.count({ where: completionFilter }),
      prisma.taskCompletion.count({ 
        where: { ...completionFilter, status: 'COMPLETED' } 
      }),
      prisma.taskCompletion.count({ 
        where: { ...completionFilter, status: 'IN_PROGRESS' } 
      }),
      prisma.taskCompletion.count({ 
        where: { ...completionFilter, status: 'FAILED' } 
      }),
      prisma.taskCompletion.count({ 
        where: { ...completionFilter, status: 'PENDING' } 
      }),

      // Average completion time calculation
      prisma.taskCompletion.aggregate({
        where: {
          ...completionFilter,
          status: 'COMPLETED',
          completedAt: { not: null }
        },
        _avg: {
          progress: true
        }
      }),

      // Engagement Metrics
      prisma.taskCompletion.findMany({
        where: completionFilter,
        distinct: ['userId'],
        select: { userId: true }
      }),
      prisma.task.aggregate({
        where: taskFilter,
        _sum: { attempts: true }
      }),
      prisma.taskCompletion.findMany({
        where: {
          createdAt: { gte: new Date(now.getTime() - (24 * 60 * 60 * 1000)) }
        },
        include: {
          task: { select: { title: true, category: true } },
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          tasksCompleted: true,
          totalPoints: true
        },
        orderBy: { tasksCompleted: 'desc' },
        take: 10
      }),

      // Reward Analytics
      prisma.taskCompletion.aggregate({
        where: {
          ...completionFilter,
          status: 'COMPLETED'
        },
        _sum: { reward: true }
      }),
      prisma.task.aggregate({
        where: taskFilter,
        _avg: { reward: true }
      }),
      prisma.task.groupBy({
        by: ['category'],
        where: taskFilter,
        _sum: { reward: true },
        _avg: { reward: true },
        _count: true
      }),

      // Performance Data
      prisma.task.findMany({
        where: taskFilter,
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          reward: true,
          completions: true,
          attempts: true,
          _count: {
            select: {
              taskCompletions: {
                where: { status: 'COMPLETED' }
              }
            }
          }
        },
        orderBy: { completions: 'desc' },
        take: 10
      }),

      // Daily completion trends for the timeframe
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_completions,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful_completions,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_completions
        FROM task_completions 
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

      // Category performance analysis
      prisma.$queryRaw`
        SELECT 
          t.category,
          COUNT(tc.id) as total_attempts,
          COUNT(CASE WHEN tc.status = 'COMPLETED' THEN 1 END) as completions,
          AVG(CASE WHEN tc.status = 'COMPLETED' THEN tc.reward ELSE 0 END) as avg_reward,
          AVG(t.reward) as avg_task_reward,
          (COUNT(CASE WHEN tc.status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(tc.id)) as completion_rate
        FROM tasks t
        LEFT JOIN task_completions tc ON t.id = tc.task_id
        WHERE tc.created_at >= ${startDate}
        GROUP BY t.category
      `
    ])

    // Calculate completion rates - ensure we're working with numbers
    const totalCompletionsNum = Number(totalCompletions) || 0
    const completedTasksNum = Number(completedTasks) || 0
    const failedTasksNum = Number(failedTasks) || 0
    const pendingApprovalNum = Number(pendingApproval) || 0
    const inProgressTasksNum = Number(inProgressTasks) || 0
    
    const uniqueParticipantsNum = Array.isArray(uniqueParticipants) ? uniqueParticipants.length : 0
    const totalAttemptsNum = totalAttempts?._sum?.attempts ? Number(totalAttempts._sum.attempts) : 0
    const totalRewardsNum = totalRewardsDistributed?._sum?.reward ? Number(totalRewardsDistributed._sum.reward) : 0
    const avgRewardNum = avgRewardPerTask?._avg?.reward ? Number(avgRewardPerTask._avg.reward) : 0

    const overallCompletionRate = totalCompletionsNum > 0 ? (completedTasksNum / totalCompletionsNum) * 100 : 0
    const successRate = totalCompletionsNum > 0 ? (completedTasksNum / totalCompletionsNum) * 100 : 0
    const failureRate = totalCompletionsNum > 0 ? (failedTasksNum / totalCompletionsNum) * 100 : 0

    // Task engagement scores
    const engagementScore = uniqueParticipantsNum > 0 ? 
      (completedTasksNum / uniqueParticipantsNum) : 0

    // Calculate average completion time in hours
    const avgCompletionHours = avgCompletionTime?._avg?.progress ? 
      Number(avgCompletionTime._avg.progress) / 60 : 0

    // Top performing tasks with completion rates
    const topTasks = tasksWithCompletions.map(task => ({
      ...task,
      completionRate: task.attempts > 0 ? (task.completions / task.attempts) * 100 : 0,
      engagement: task._count.taskCompletions,
      roi: task.reward > 0 ? (task.completions * task.reward) / (task.attempts * task.reward) : 0
    }))

    // Prepare response data
    const analytics = {
      overview: {
        totalTasks,
        activeTasks,
        archivedTasks,
        totalCompletions: totalCompletionsNum,
        uniqueParticipants: uniqueParticipantsNum,
        overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
        engagementScore: Math.round(engagementScore * 100) / 100,
        totalRewardsDistributed: totalRewardsNum,
        avgRewardPerTask: Math.round(avgRewardNum * 100) / 100
      },

      completion: {
        completedTasks: completedTasksNum,
        inProgressTasks: inProgressTasksNum,
        failedTasks: failedTasksNum,
        pendingApproval: pendingApprovalNum,
        successRate: Math.round(successRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
        avgCompletionTime: Math.round(avgCompletionHours * 100) / 100
      },

      engagement: {
        totalAttempts: totalAttemptsNum,
        averageAttemptsPerUser: uniqueParticipantsNum > 0 ? 
          Math.round((totalAttemptsNum / uniqueParticipantsNum) * 100) / 100 : 0,
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          user: activity.user.name || activity.user.email,
          task: activity.task.title,
          category: activity.task.category,
          status: activity.status,
          timestamp: activity.createdAt
        })),
        topPerformers: topPerformers.map(user => ({
          id: user.id,
          name: user.name || user.email,
          tasksCompleted: user.tasksCompleted,
          totalPoints: user.totalPoints
        }))
      },

      rewards: {
        totalDistributed: totalRewardsNum,
        averageReward: Math.round(avgRewardNum * 100) / 100,
        rewardsByCategory: rewardsByCategory.map(cat => ({
          category: cat.category,
          totalRewards: cat._sum.reward ? Number(cat._sum.reward) : 0,
          averageReward: cat._avg.reward ? Math.round(Number(cat._avg.reward) * 100) / 100 : 0,
          taskCount: cat._count
        }))
      },

      performance: {
        topTasks: topTasks.slice(0, 10),
        categoryBreakdown: tasksByCategory.map(cat => ({
          category: cat.category,
          count: cat._count
        })),
        difficultyBreakdown: tasksByDifficulty.map(diff => ({
          difficulty: diff.difficulty,
          count: diff._count
        })),
        completionTrends: Array.isArray(completionTrends) ? completionTrends : [],
        categoryPerformance: Array.isArray(categoryPerformance) ? categoryPerformance : []
      },

      insights: {
        bestPerformingCategory: Array.isArray(categoryPerformance) && categoryPerformance.length > 0 ? 
          categoryPerformance[0].category : 'No data',
        recommendedActions: generateRecommendations({
          completionRate: successRate,
          engagementScore,
          failureRate,
          avgReward: avgRewardNum
        })
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching task analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to generate recommendations
function generateRecommendations(metrics: {
  completionRate: number;
  engagementScore: number;
  failureRate: number;
  avgReward: number;
}) {
  const recommendations = []

  if (metrics.completionRate < 50) {
    recommendations.push({
      type: 'warning',
      message: 'Low completion rate detected. Consider simplifying task requirements or providing better instructions.',
      action: 'Review task difficulty and clarity'
    })
  }

  if (metrics.failureRate > 30) {
    recommendations.push({
      type: 'error',
      message: 'High failure rate indicates tasks may be too difficult or unclear.',
      action: 'Audit failed tasks and improve guidance'
    })
  }

  if (metrics.engagementScore < 2) {
    recommendations.push({
      type: 'info',
      message: 'Low user engagement. Consider increasing rewards or adding gamification elements.',
      action: 'Enhance reward system and user motivation'
    })
  }

  if (metrics.avgReward < 50) {
    recommendations.push({
      type: 'info',
      message: 'Average reward is below market expectations. Consider adjusting reward structure.',
      action: 'Review and optimize reward amounts'
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'Task system is performing well! Continue monitoring for optimization opportunities.',
      action: 'Maintain current performance standards'
    })
  }

  return recommendations
} 