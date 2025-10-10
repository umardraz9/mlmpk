'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Network, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Target,
  Award,
  Activity,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Crown,
  Star,
  Layers,
  UserCheck,
  Zap,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react'

// Force dynamic rendering to avoid build errors
export const dynamic = 'force-dynamic'

interface MLMAnalyticsData {
  timeframe: string
  networkOverview: {
    totalMembers: number
    activeMembers: number
    newMembers: number
    totalSponsors: number
    activeSponsors: number
    networkDepth: number
    averageTeamSize: number
    retentionRate: number
    activationRate: number
    sponsorEfficiency: number
  }
  teamPerformance: {
    topPerformers: any[]
    teamLeaders: any[]
    recruitmentStats: any[]
    earningDistribution: any[]
    teamGrowthRates: any[]
  }
  growthMetrics: {
    monthlyGrowth: any[]
    recruitmentTrends: any[]
    retentionTrends: any[]
    activationTrends: any[]
    forecastData: any[]
  }
  commissionAnalytics: {
    totalCommissions: any
    commissionByLevel: any[]
    commissionEfficiency: any
    payoutAnalysis: any
    conversionRates: any
  }
  levelAnalysis: {
    levelStats: any[]
    levelEfficiency: any[]
    levelDistribution: any[]
  }
  networkVisualization: {
    networkStructure: any
    connectionStrength: any[]
    influencerNodes: any[]
    networkClusters: any[]
  }
  performanceMetrics: {
    kpis: any
    benchmarks: any
    efficiency: any
    productivity: any
  }
  engagementMetrics: {
    activityLevels: any
    communicationMetrics: any
    participationRates: any
    satisfactionScores: any
  }
}

function MLMAnalytics() {
  const [data, setData] = useState<MLMAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    fetchAnalytics()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAnalytics()
      }, 300000) // Refresh every 5 minutes
      
      return () => clearInterval(interval)
    }
  }, [timeframe, autoRefresh])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics/mlm?timeframe=${timeframe}`)
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error fetching MLM analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num)
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4" />
    if (growth < 0) return <TrendingDown className="w-4 h-4" />
    return <Activity className="w-4 h-4" />
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return <div>Error loading analytics data</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MLM Network Analytics</h1>
          <p className="text-gray-600">Team performance, growth metrics, and network visualization</p>
        </div>
        
        <div className="flex items-center space-x-4">
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.networkOverview.totalMembers)}</div>
            <p className="text-xs text-muted-foreground">
              {data.networkOverview.newMembers} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(data.networkOverview.activeMembers)}</div>
            <p className="text-xs text-muted-foreground">
              {data.networkOverview.activationRate.toFixed(1)}% activation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Depth</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.networkOverview.networkDepth}</div>
            <p className="text-xs text-muted-foreground">
              levels deep
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.networkOverview.averageTeamSize.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              avg per sponsor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.networkOverview.retentionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              30-day retention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="levels">Levels</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.teamPerformance.topPerformers.slice(0, 5).map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(performer.name, performer.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{performer.name || performer.username || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{performer.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(performer.totalEarnings)}</div>
                        <div className="text-xs text-gray-500">{performer.tasksCompleted} tasks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Leaders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-blue-500" />
                  Team Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.teamPerformance.teamLeaders.slice(0, 5).map((leader, index) => (
                    <div key={leader.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(leader.name, leader.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{leader.name || leader.username || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{leader.team_size} team members</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{formatCurrency(leader.team_earnings)}</div>
                        <div className="text-xs text-gray-500">team earnings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Earning Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Earning Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.teamPerformance.earningDistribution.map((range) => (
                    <div key={range.earning_range} className="flex items-center justify-between">
                      <span className="text-sm font-medium">PKR {range.earning_range}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            data-width={`${(range.user_count / Math.max(...data.teamPerformance.earningDistribution.map(r => r.user_count))) * 100}%`}
                            style={{ 
                              width: `${(range.user_count / Math.max(...data.teamPerformance.earningDistribution.map(r => r.user_count))) * 100}%` 
                            } as React.CSSProperties}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{range.user_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Network Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Network Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sponsor Efficiency</span>
                    <span>{data.networkOverview.sponsorEfficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={data.networkOverview.sponsorEfficiency} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Activation Rate</span>
                    <span>{data.networkOverview.activationRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={data.networkOverview.activationRate} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Retention Rate</span>
                    <span>{data.networkOverview.retentionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={data.networkOverview.retentionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPIs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Members</div>
                    <div className="text-xl font-bold">{formatNumber(data.performanceMetrics.kpis.total_members || 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Active Members</div>
                    <div className="text-xl font-bold text-green-600">{formatNumber(data.performanceMetrics.kpis.active_members || 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Earning Members</div>
                    <div className="text-xl font-bold text-blue-600">{formatNumber(data.performanceMetrics.kpis.earning_members || 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Max Earners</div>
                    <div className="text-xl font-bold text-purple-600">{formatNumber(data.performanceMetrics.kpis.max_earners || 0)}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Average Earnings</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(data.performanceMetrics.kpis.avg_earnings || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Efficiency Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Efficiency Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Active Sponsors</div>
                  <div className="text-xl font-bold">{formatNumber(data.performanceMetrics.efficiency.active_sponsors || 0)}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Avg Recruits/Sponsor</div>
                  <div className="text-xl font-bold text-blue-600">
                    {(data.performanceMetrics.efficiency.avg_recruits_per_sponsor || 0).toFixed(1)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Avg Team Earnings</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(data.performanceMetrics.efficiency.avg_team_earnings || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Productivity Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Productivity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Avg Days to First Recruit</div>
                  <div className="text-xl font-bold">
                    {(data.performanceMetrics.productivity.avg_days_to_first_recruit || 0).toFixed(0)} days
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Quick Earner Rate</div>
                  <div className="text-xl font-bold text-green-600">
                    {(data.performanceMetrics.productivity.quick_earner_rate || 0).toFixed(1)}%
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">New Quick Earners</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatNumber(data.performanceMetrics.productivity.quick_earners || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benchmarks Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Performance vs Industry Benchmarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium mb-2">Retention Rate</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Platform</span>
                      <span className="font-bold text-green-600">{data.performanceMetrics.benchmarks.platform_retention}%</span>
                    </div>
                    <Progress value={data.performanceMetrics.benchmarks.platform_retention} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Industry Avg</span>
                      <span>{data.performanceMetrics.benchmarks.industry_avg_retention}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Activation Rate</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Platform</span>
                      <span className="font-bold text-blue-600">{data.performanceMetrics.benchmarks.platform_activation}%</span>
                    </div>
                    <Progress value={data.performanceMetrics.benchmarks.platform_activation} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Industry Avg</span>
                      <span>{data.performanceMetrics.benchmarks.industry_avg_activation}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Average Earnings</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Platform</span>
                      <span className="font-bold text-purple-600">{formatCurrency(data.performanceMetrics.benchmarks.platform_avg_earnings)}</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Industry Avg</span>
                      <span>{formatCurrency(data.performanceMetrics.benchmarks.industry_avg_earnings)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-6">
          {/* Growth Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.growthMetrics.monthlyGrowth.length > 0 ? 
                    formatNumber(data.growthMetrics.monthlyGrowth[data.growthMetrics.monthlyGrowth.length - 1]?.new_members || 0) : 
                    '0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">new members this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retention Trend</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data.growthMetrics.retentionTrends.length > 0 ? 
                    (data.growthMetrics.retentionTrends[data.growthMetrics.retentionTrends.length - 1]?.retention_rate || 0).toFixed(1) : 
                    '0.0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">current retention rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activation Trend</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {data.growthMetrics.activationTrends.length > 0 ? 
                    (data.growthMetrics.activationTrends[data.growthMetrics.activationTrends.length - 1]?.activation_rate || 0).toFixed(1) : 
                    '0.0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">current activation rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forecast</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {data.growthMetrics.forecastData.length > 0 ? 
                    formatNumber(data.growthMetrics.forecastData[2]?.projected_members || 0) : 
                    '0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">projected in 3 months</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Growth Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Team Growth Leaders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.teamPerformance.teamGrowthRates.slice(0, 10).map((team, index) => (
                  <div key={team.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">{team.name || team.email}</div>
                        <div className="text-xs text-gray-500">
                          {team.total_team} team members • {team.new_recruits} new this period
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{team.growth_rate}%</div>
                      <div className="text-xs text-gray-500">growth rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commission Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Commission Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Total Commissions</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.commissionAnalytics.totalCommissions.total)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Pending</div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(data.commissionAnalytics.totalCommissions.pending)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Paid</div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(data.commissionAnalytics.totalCommissions.paid)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission by Level */}
            <Card>
              <CardHeader>
                <CardTitle>Commission by Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.commissionAnalytics.commissionByLevel.map((level) => (
                    <div key={level.level} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Level {level.level}</Badge>
                        <span className="text-sm text-gray-600">{level.rate}%</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(level.total_commission)}</div>
                        <div className="text-xs text-gray-500">{level.user_count} users</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Commission Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Eligible Members</div>
                    <div className="text-xl font-bold">{formatNumber(data.commissionAnalytics.commissionEfficiency.total_eligible || 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Earning Members</div>
                    <div className="text-xl font-bold text-green-600">{formatNumber(data.commissionAnalytics.commissionEfficiency.earning_members || 0)}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Average Earnings</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(data.commissionAnalytics.commissionEfficiency.avg_earnings || 0)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Max Earnings</div>
                  <div className="text-lg font-bold text-purple-600">
                    {formatCurrency(data.commissionAnalytics.commissionEfficiency.max_earnings || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Activation Rate</span>
                    <span>{(data.commissionAnalytics.conversionRates.activation_rate || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={data.commissionAnalytics.conversionRates.activation_rate || 0} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Success Rate</span>
                    <span>{(data.commissionAnalytics.conversionRates.success_rate || 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={data.commissionAnalytics.conversionRates.success_rate || 0} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-sm text-gray-600">High Earners</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatNumber(data.commissionAnalytics.conversionRates.high_earners || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Members</div>
                    <div className="text-lg font-bold">
                      {formatNumber(data.commissionAnalytics.conversionRates.total_members || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs would continue here... */}
        <TabsContent value="levels">
          <Card>
            <CardHeader>
              <CardTitle>Level Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Level analysis visualization coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Network visualization tools coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Levels */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Activity Levels</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>High Activity</span>
                      <span className="font-bold text-green-600">
                        {formatNumber(data.engagementMetrics.activityLevels.high_activity || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium Activity</span>
                      <span className="font-bold text-yellow-600">
                        {formatNumber(data.engagementMetrics.activityLevels.medium_activity || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Activity</span>
                      <span className="font-bold text-red-600">
                        {formatNumber(data.engagementMetrics.activityLevels.low_activity || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Satisfaction Scores */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Satisfaction Scores</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Satisfaction</span>
                        <span>{data.engagementMetrics.satisfactionScores.overall_satisfaction}%</span>
                      </div>
                      <Progress value={data.engagementMetrics.satisfactionScores.overall_satisfaction} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Platform Usability</span>
                        <span>{data.engagementMetrics.satisfactionScores.platform_usability}%</span>
                      </div>
                      <Progress value={data.engagementMetrics.satisfactionScores.platform_usability} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Earning Satisfaction</span>
                        <span>{data.engagementMetrics.satisfactionScores.earning_satisfaction}%</span>
                      </div>
                      <Progress value={data.engagementMetrics.satisfactionScores.earning_satisfaction} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      {lastRefresh && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleString()}
        </div>
      )}
    </div>
  )
}

export default MLMAnalytics