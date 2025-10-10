'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Search,
  Calendar,
  Award,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
  Lightbulb,
  Globe,
  Clock,
  ThumbsUp,
  Star
} from 'lucide-react'

// Force dynamic rendering to avoid build errors
export const dynamic = 'force-dynamic'

interface BlogAnalytics {
  overview: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    archivedPosts: number;
    totalCategories: number;
    totalTags: number;
    totalAuthors: number;
    publishingRate: number;
  };
  engagement: {
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    avgViewsPerPost: number;
    avgEngagementRate: number;
    topPerformingPosts: Array<{
      id: string;
      title: string;
      slug: string;
      views: number;
      likes: number;
      shares: number;
      category: { name: string; color: string };
      author: { name: string; email: string };
      _count: { comments: number };
      engagementScore: number;
      engagementRate: number;
    }>;
  };
  content: {
    recentActivity: any[];
    contentTrends: any[];
    categoryPerformance: any[];
    authorPerformance: any[];
    tagPerformance: any[];
    timePatterns: any[];
  };
  seo: {
    postsWithMissingMeta: number;
    seoOptimizationScore: number;
    topKeywords: any[];
    avgReadTime: number;
    metaCompleteness: {
      withMetaTitle: number;
      withMetaDescription: number;
      total: number;
    };
  };
  insights: {
    contentHealth: {
      publishingConsistency: number;
      engagementHealth: number;
      seoOptimization: number;
      contentDiversity: number;
      authorActivity: number;
    };
    recommendations: Array<{
      type: string;
      category: string;
      message: string;
      action: string;
      priority: string;
    }>;
    bestPerformingCategory: string;
    topAuthor: string;
    growthTrend: string;
  };
}

function BlogAnalytics() {
  const [analytics, setAnalytics] = useState<BlogAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [timeframe, setTimeframe] = useState('30d')
  const [category, setCategory] = useState('all')
  const [author, setAuthor] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe, category, author])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 300000) // 5 minutes
      return () => clearInterval(interval)
    }
  }, [autoRefresh, timeframe, category, author])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        timeframe,
        category,
        author
      })

      const response = await fetch(`/api/admin/analytics/blog?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching blog analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !analytics) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading blog analytics...</span>
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
    { id: 'engagement', label: 'Engagement', icon: Heart },
    { id: 'content', label: 'Content Performance', icon: FileText },
    { id: 'seo', label: 'SEO Analytics', icon: Search },
    { id: 'insights', label: 'Insights & Recommendations', icon: Lightbulb }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-600" />
            Blog Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Content performance, engagement metrics, and SEO insights
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
              </SelectContent>
            </Select>
            <Select value={author} onValueChange={setAuthor}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
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
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalPosts}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="default">{analytics.overview.publishedPosts} Published</Badge>
                <Badge variant="secondary">{analytics.overview.draftPosts} Drafts</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.engagement.totalViews.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg {analytics.engagement.avgViewsPerPost} views per post
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.engagement.avgEngagementRate}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Likes, shares, and comments
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publishing Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.publishingRate}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Posts per week
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{analytics.engagement.totalLikes.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                <Share2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{analytics.engagement.totalShares.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{analytics.engagement.totalComments.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.engagement.avgEngagementRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.engagement.topPerformingPosts.slice(0, 10).map((post, index) => (
                  <div key={post.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{post.title}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post._count.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {post.engagementRate}% engagement
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Score: {post.engagementScore}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SEO Score</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics.seo.seoOptimizationScore)}%</div>
                <Progress value={analytics.seo.seoOptimizationScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missing Meta</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{analytics.seo.postsWithMissingMeta}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Posts need SEO optimization
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Read Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.seo.avgReadTime} min</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Average reading time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meta Complete</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {analytics.seo.metaCompleteness.withMetaTitle}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Of {analytics.seo.metaCompleteness.total} total posts
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Content Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Content Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Publishing Consistency</div>
                  <Progress value={analytics.insights.contentHealth.publishingConsistency} className="mb-1" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(analytics.insights.contentHealth.publishingConsistency)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Engagement Health</div>
                  <Progress value={analytics.insights.contentHealth.engagementHealth} className="mb-1" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(analytics.insights.contentHealth.engagementHealth)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">SEO Optimization</div>
                  <Progress value={analytics.insights.contentHealth.seoOptimization} className="mb-1" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(analytics.insights.contentHealth.seoOptimization)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Content Diversity</div>
                  <div className="text-2xl font-bold">{analytics.insights.contentHealth.contentDiversity}</div>
                  <div className="text-xs text-muted-foreground">Active categories</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Author Activity</div>
                  <div className="text-2xl font-bold">{analytics.insights.contentHealth.authorActivity}</div>
                  <div className="text-xs text-muted-foreground">Active authors</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Best Category</h4>
                  <p className="text-blue-800">{analytics.insights.bestPerformingCategory}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Top Author</h4>
                  <p className="text-green-800">{analytics.insights.topAuthor}</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Growth Trend</h4>
                  <p className="text-purple-800">{analytics.insights.growthTrend}</p>
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
                {analytics.insights.recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      rec.type === 'success' ? 'bg-green-50 border-green-200' :
                      rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      rec.type === 'error' ? 'bg-red-50 border-red-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {rec.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                      {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                      {rec.type === 'error' && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                      {rec.type === 'info' && <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${
                            rec.type === 'success' ? 'text-green-900' :
                            rec.type === 'warning' ? 'text-yellow-900' :
                            rec.type === 'error' ? 'text-red-900' :
                            'text-blue-900'
                          }`}>
                            {rec.category}
                          </h4>
                          <Badge 
                            variant={rec.priority === 'high' ? 'destructive' : 
                                    rec.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {rec.priority} priority
                          </Badge>
                        </div>
                        <p className={`text-sm mb-2 ${
                          rec.type === 'success' ? 'text-green-800' :
                          rec.type === 'warning' ? 'text-yellow-800' :
                          rec.type === 'error' ? 'text-red-800' :
                          'text-blue-800'
                        }`}>
                          {rec.message}
                        </p>
                        <p className={`text-xs font-medium ${
                          rec.type === 'success' ? 'text-green-700' :
                          rec.type === 'warning' ? 'text-yellow-700' :
                          rec.type === 'error' ? 'text-red-700' :
                          'text-blue-700'
                        }`}>
                          Action: {rec.action}
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

export default BlogAnalytics