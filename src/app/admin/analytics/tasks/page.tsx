'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckSquare, 
  TrendingUp, 
  Users, 
  Target,
  Award,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Star,
  Trophy,
  Activity,
  BarChart3,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Lightbulb
} from 'lucide-react'

interface TaskAnalytics {
  overview: {
    totalTasks: number;
    activeTasks: number;
    archivedTasks: number;
    totalCompletions: number;
    uniqueParticipants: number;
    overallCompletionRate: number;
    engagementScore: number;
    totalRewardsDistributed: number;
    avgRewardPerTask: number;
  };
  completion: {
    completedTasks: number;
    inProgressTasks: number;
    failedTasks: number;
    pendingApproval: number;
    successRate: number;
    failureRate: number;
    avgCompletionTime: number;
  };
  engagement: {
    totalAttempts: number;
    averageAttemptsPerUser: number;
    recentActivity: Array<{
      id: string;
      user: string;
      task: string;
      category: string;
      status: string;
      timestamp: string;
    }>;
    topPerformers: Array<{
      id: string;
      name: string;
      tasksCompleted: number;
      totalPoints: number;
    }>;
  };
  rewards: {
    totalDistributed: number;
    averageReward: number;
    rewardsByCategory: Array<{
      category: string;
      totalRewards: number;
      averageReward: number;
      taskCount: number;
    }>;
  };
  performance: {
    topTasks: Array<{
      id: string;
      title: string;
      category: string;
      difficulty: string;
      reward: number;
      completions: number;
      attempts: number;
      completionRate: number;
      engagement: number;
      roi: number;
    }>;
    categoryBreakdown: Array<{
      category: string;
      count: number;
    }>;
    difficultyBreakdown: Array<{
      difficulty: string;
      count: number;
    }>;
    completionTrends: Array<{
      date: string;
      total_completions: number;
      successful_completions: number;
      failed_completions: number;
    }>;
    categoryPerformance: Array<{
      category: string;
      total_attempts: number;
      completions: number;
      avg_reward: number;
      avg_task_reward: number;
      completion_rate: number;
    }>;
  };
  insights: {
    bestPerformingCategory: string;
    recommendedActions: Array<{
      type: string;
      message: string;
      action: string;
    }>;
  };
}

export default function TaskAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [timeframe, setTimeframe] = useState('30d')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe, category, difficulty])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 300000) // 5 minutes
      return () => clearInterval(interval)
    }
  }, [autoRefresh, timeframe, category, difficulty])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        timeframe,
        category,
        difficulty
      })

      const response = await fetch(`/api/admin/analytics/tasks?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching task analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/tasks/export?timeframe=${timeframe}&category=${category}&difficulty=${difficulty}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `task-analytics-${timeframe}-${Date.now()}.csv`
      a.click()
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  if (loading && !analytics) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading task analytics...</span>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p>No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'completion', label: 'Completion Analysis', icon: CheckCircle },
    { id: 'engagement', label: 'User Engagement', icon: Users },
    { id: 'rewards', label: 'Reward Analytics', icon: DollarSign },
    { id: 'performance', label: 'Performance Metrics', icon: TrendingUp },
    { id: 'insights', label: 'Insights & Recommendations', icon: Lightbulb }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckSquare className="h-8 w-8 text-blue-600" />
            Task Performance Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into task completion, engagement, and effectiveness
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className="h-4 w-4 mr-1" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="365d">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Product Reviews">Product Reviews</SelectItem>
                <SelectItem value="Content Creation">Content Creation</SelectItem>
                <SelectItem value="Lead Generation">Lead Generation</SelectItem>
                <SelectItem value="Platform Engagement">Platform Engagement</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
            {lastUpdated && (
              <div className="ml-auto text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="whitespace-nowrap"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </CardHeader>
      </Card>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalTasks.toLocaleString()}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{analytics.overview.activeTasks} Active</Badge>
                <Badge variant="outline">{analytics.overview.archivedTasks} Archived</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalCompletions.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.overview.uniqueParticipants} unique participants
              </div>
              <Progress 
                value={analytics.overview.overallCompletionRate} 
                className="mt-2" 
              />
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.overview.overallCompletionRate}% completion rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.engagementScore}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Average tasks per user
              </div>
              <div className="mt-2">
                <Badge 
                  variant={analytics.overview.engagementScore >= 3 ? "default" : 
                           analytics.overview.engagementScore >= 2 ? "secondary" : "destructive"}
                >
                  {analytics.overview.engagementScore >= 3 ? "High" : 
                   analytics.overview.engagementScore >= 2 ? "Medium" : "Low"} Engagement
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {analytics.overview.totalRewardsDistributed.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg PKR {analytics.overview.avgRewardPerTask} per task
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'completion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.completion.completedTasks.toLocaleString()}</div>
                <Progress value={analytics.completion.successRate} className="mt-2 [&>div]:bg-green-600" />
                <div className="text-xs text-muted-foreground mt-1">
                  {analytics.completion.successRate}% success rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics.completion.inProgressTasks.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Avg completion time: {analytics.completion.avgCompletionTime}h
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Tasks</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.completion.failedTasks.toLocaleString()}</div>
                <Progress value={analytics.completion.failureRate} className="mt-2 [&>div]:bg-red-600" />
                <div className="text-xs text-muted-foreground mt-1">
                  {analytics.completion.failureRate}% failure rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{analytics.completion.pendingApproval.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Awaiting review
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Completion Rate Health */}
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-sm text-muted-foreground">{analytics.completion.successRate}%</span>
                  </div>
                  <Progress 
                    value={analytics.completion.successRate} 
                    className="[&>div]:bg-green-600" 
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Failure Rate</span>
                    <span className="text-sm text-muted-foreground">{analytics.completion.failureRate}%</span>
                  </div>
                  <Progress 
                    value={analytics.completion.failureRate} 
                    className="[&>div]:bg-red-600" 
                  />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {analytics.completion.successRate >= 70 ? (
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">
                      {analytics.completion.successRate >= 70 
                        ? "Task completion rates are healthy" 
                        : "Task completion rates need improvement"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.engagement.totalAttempts.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Across all tasks and users
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Attempts/User</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.engagement.averageAttemptsPerUser}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  User engagement level
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.overview.uniqueParticipants.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Participating in tasks
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.engagement.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{activity.user}</p>
                        <p className="text-xs text-muted-foreground">{activity.task}</p>
                        <p className="text-xs text-muted-foreground">{activity.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={activity.status === 'COMPLETED' ? 'default' : 
                                  activity.status === 'IN_PROGRESS' ? 'secondary' : 'destructive'}
                        >
                          {activity.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.engagement.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{performer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {performer.totalPoints.toLocaleString()} points
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {performer.tasksCompleted} tasks
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">PKR {analytics.rewards.totalDistributed.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Lifetime reward distribution
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Reward</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">PKR {analytics.rewards.averageReward}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Per completed task
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reward Efficiency</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.completion.completedTasks > 0 ? 
                    Math.round((analytics.rewards.totalDistributed / analytics.completion.completedTasks) * 100) / 100 : 0}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Cost per completion
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rewards by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Rewards by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.rewards.rewardsByCategory.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="text-right">
                        <span className="font-bold">PKR {category.totalRewards.toLocaleString()}</span>
                        <p className="text-xs text-muted-foreground">
                          Avg PKR {category.averageReward} ({category.taskCount} tasks)
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={(category.totalRewards / analytics.rewards.totalDistributed) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Category and Difficulty Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performance.categoryBreakdown.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{cat.category}</span>
                      <Badge variant="secondary">{cat.count} tasks</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performance.difficultyBreakdown.map((diff, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{diff.difficulty}</span>
                      <Badge 
                        variant={diff.difficulty === 'EASY' ? 'secondary' : 
                                diff.difficulty === 'MEDIUM' ? 'default' : 'destructive'}
                      >
                        {diff.count} tasks
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Task</th>
                      <th className="text-left py-2">Category</th>
                      <th className="text-left py-2">Difficulty</th>
                      <th className="text-center py-2">Completion Rate</th>
                      <th className="text-center py-2">Engagement</th>
                      <th className="text-right py-2">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.performance.topTasks.slice(0, 10).map((task, index) => (
                      <tr key={task.id} className="border-b">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.completions}/{task.attempts} attempts
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">{task.category}</Badge>
                        </td>
                        <td className="py-3">
                          <Badge 
                            variant={task.difficulty === 'EASY' ? 'secondary' : 
                                    task.difficulty === 'MEDIUM' ? 'default' : 'destructive'}
                          >
                            {task.difficulty}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">{task.completionRate.toFixed(1)}%</span>
                            <Progress 
                              value={task.completionRate} 
                              className="w-16 h-1 mt-1" 
                            />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant="secondary">{task.engagement}</Badge>
                        </td>
                        <td className="py-3 text-right font-medium">
                          PKR {task.reward}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Best Performing Category</h4>
                  <p className="text-blue-800">{analytics.insights.bestPerformingCategory}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Success Metrics</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• {analytics.completion.successRate}% completion rate</li>
                      <li>• {analytics.overview.engagementScore} avg tasks per user</li>
                      <li>• PKR {analytics.rewards.averageReward} average reward</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-2">Areas for Improvement</h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• {analytics.completion.failureRate}% failure rate</li>
                      <li>• {analytics.completion.pendingApproval} pending approvals</li>
                      <li>• {analytics.completion.avgCompletionTime}h avg completion time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.insights.recommendedActions.map((recommendation, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      recommendation.type === 'success' ? 'bg-green-50 border-green-200' :
                      recommendation.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      recommendation.type === 'error' ? 'bg-red-50 border-red-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {recommendation.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                      {recommendation.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                      {recommendation.type === 'error' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                      {recommendation.type === 'info' && <Eye className="h-5 w-5 text-blue-600 mt-0.5" />}
                      
                      <div className="flex-1">
                        <h4 className={`font-medium mb-1 ${
                          recommendation.type === 'success' ? 'text-green-900' :
                          recommendation.type === 'warning' ? 'text-yellow-900' :
                          recommendation.type === 'error' ? 'text-red-900' :
                          'text-blue-900'
                        }`}>
                          {recommendation.action}
                        </h4>
                        <p className={`text-sm ${
                          recommendation.type === 'success' ? 'text-green-800' :
                          recommendation.type === 'warning' ? 'text-yellow-800' :
                          recommendation.type === 'error' ? 'text-red-800' :
                          'text-blue-800'
                        }`}>
                          {recommendation.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 