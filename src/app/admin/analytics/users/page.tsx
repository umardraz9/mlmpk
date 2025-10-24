'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  TrendingUp, 
  Activity, 
  DollarSign,
  Calendar,
  Target,
  Star,
  Award,
  RefreshCw,
  Filter,
  Search,
  Download,
  Eye,
  MessageCircle,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Clock,
  UserPlus,
  UserMinus,
  Crown,
  Gift
} from 'lucide-react'

interface UserAnalyticsData {
  timeframe: string
  dateRange: { start: string; end: string }
  userOverview: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    inactiveUsers: number
    premiumUsers: number
    retentionRate: number
    churnRate: number
    averageAge: number
    genderDistribution: any
  }
  userSegmentation: {
    byRole: any[]
    byActivity: any[]
    byEarnings: any[]
    byRegion: any[]
    byJoinDate: any[]
    bySponsorStatus: any[]
  }
  engagementMetrics: {
    loginFrequency: any
    sessionDuration: any
    pageViews: any
    taskEngagement: any
    blogEngagement: any
    productEngagement: any
    socialEngagement: any
  }
  behaviorPatterns: {
    peakActivityHours: any[]
    commonUserJourneys: any[]
    dropoffPoints: any[]
    conversionFunnels: any[]
    featureUsage: any
    devicePreferences: any
  }
  performanceMetrics: {
    topPerformers: any[]
    earningDistribution: any
    taskCompletion: any
    referralPerformance: any
    networkGrowth: any
    achievementMetrics: any
  }
  userLifecycle: {
    newUserOnboarding: any
    userActivation: any
    retentionRates: any
    lifecycleStages: any
    churnPrediction: any
  }
  detailedUsers: {
    users: any[]
    total: number
  }
  retentionAnalysis: {
    cohortData: any
    retentionBySegment: any
    churnAnalysis: any
  }
  generatedAt: string
}

export default function UserAnalyticsPage() {
  const [data, setData] = useState<UserAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [userSegment, setUserSegment] = useState('all')
  const [sortBy, setSortBy] = useState('activity')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe, userSegment, sortBy, currentPage])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, timeframe, userSegment, sortBy, currentPage])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/analytics/users?timeframe=${timeframe}&segment=${userSegment}&sortBy=${sortBy}&page=${currentPage}&limit=20`
      )
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching user analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchAnalytics()
  }

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting user analytics data...')
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Failed to load user analytics data</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return <div>Error loading user analytics</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Analytics</h1>
          <p className="text-gray-600">Deep insights into user behavior and engagement</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={userSegment} onValueChange={setUserSegment}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="new">New Users</SelectItem>
            <SelectItem value="active">Active Users</SelectItem>
            <SelectItem value="inactive">Inactive Users</SelectItem>
            <SelectItem value="high_earners">High Earners</SelectItem>
            <SelectItem value="sponsors">Sponsors</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activity">Activity</SelectItem>
            <SelectItem value="earnings">Earnings</SelectItem>
            <SelectItem value="tasks">Tasks</SelectItem>
            <SelectItem value="points">Points</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.userOverview.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              +{data.userOverview.newUsers} new this {timeframe}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.userOverview.activeUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              {data.userOverview.retentionRate.toFixed(1)}% retention rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.userOverview.premiumUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              {((data.userOverview.premiumUsers / data.userOverview.totalUsers) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <UserMinus className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.userOverview.churnRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">
              {data.userOverview.inactiveUsers} inactive users
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Users</span>
                    <span className="text-sm font-medium">{data.userOverview.activeUsers}</span>
                  </div>
                  <Progress value={(data.userOverview.activeUsers / data.userOverview.totalUsers) * 100} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Premium Users</span>
                    <span className="text-sm font-medium">{data.userOverview.premiumUsers}</span>
                  </div>
                  <Progress value={(data.userOverview.premiumUsers / data.userOverview.totalUsers) * 100} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Inactive Users</span>
                    <span className="text-sm font-medium">{data.userOverview.inactiveUsers}</span>
                  </div>
                  <Progress value={(data.userOverview.inactiveUsers / data.userOverview.totalUsers) * 100} />
                </div>
              </CardContent>
            </Card>

            {/* User Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.userOverview.averageAge}</div>
                    <div className="text-sm text-gray-500">Avg. Account Age (days)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{data.userOverview.retentionRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Retention Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{data.userOverview.newUsers}</div>
                    <div className="text-sm text-gray-500">New Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{data.userOverview.churnRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Churn Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segmentation" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Segmentation */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.userSegmentation.byActivity.map((segment: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{segment.segment}</span>
                      </div>
                      <Badge variant="outline">{segment.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Earnings Segmentation */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.userSegmentation.byEarnings.map((segment: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{segment.segment}</span>
                      </div>
                      <Badge variant="outline">{segment.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.userSegmentation.byRole.map((role: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">{role.role}</span>
                      </div>
                      <Badge variant="outline">{role._count.id}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">85%</div>
                  <div className="text-sm text-gray-500">Completion Rate</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blog Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">72%</div>
                  <div className="text-sm text-gray-500">Read Rate</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">45%</div>
                  <div className="text-sm text-gray-500">Purchase Rate</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peak Activity Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500">
                  Behavior patterns visualization would go here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Journeys</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500">
                  User journey mapping would go here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.detailedUsers.users.slice(0, 5).map((user: any, index: number) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium">#{index + 1}</div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.avatar || undefined} />
                          <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">₨{user.totalEarnings.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{user.tasksCompleted} tasks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Task Completion</span>
                    <span className="text-sm font-medium">8.5/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Earnings</span>
                    <span className="text-sm font-medium">₨2,450/month</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg. Points</span>
                    <span className="text-sm font-medium">1,250/week</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Referral Rate</span>
                    <span className="text-sm font-medium">12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>New User Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">78%</div>
                  <div className="text-sm text-gray-500">Complete Profile</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">65%</div>
                  <div className="text-sm text-gray-500">First Task Complete</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">82%</div>
                  <div className="text-sm text-gray-500">30-Day Retention</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed User List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed User Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.detailedUsers.users.map((user: any) => (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400">@{user.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{user.role}</Badge>
                    {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">₨{user.totalEarnings.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{user.totalPoints.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{user.tasksCompleted}</div>
                    <div className="text-xs text-gray-500">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{user.engagementScore.toFixed(0)}</div>
                    <div className="text-xs text-gray-500">Engagement Score</div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                  <span>Account Age: {user.accountAge} days</span>
                  <span>Last Activity: {new Date(user.lastActivity).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {Math.ceil(data.detailedUsers.total / 20)}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(data.detailedUsers.total / 20)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  )
} 