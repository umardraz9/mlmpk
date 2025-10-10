'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart,
  BarChart3,
  Eye,
  Star,
  AlertTriangle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  Zap
} from 'lucide-react'

interface ProductAnalyticsData {
  timeframe: string
  category: string
  salesOverview: {
    totalProducts: number
    activeProducts: number
    totalSales: number
    totalRevenue: number
    averageOrderValue: number
    salesGrowth: number
    topSellingProducts: any[]
  }
  inventoryAnalytics: {
    totalInventoryValue: number
    lowStockProducts: any[]
    outOfStockProducts: any[]
    inventoryTurnover: number
    stockLevels: any[]
    inventoryByCategory: any[]
  }
  productPerformance: {
    performanceMetrics: any
    salesTrends: any[]
    productRankings: any[]
    viewsToSalesConversion: any[]
    customerFavorites: any[]
    seasonalTrends: any[]
  }
  revenueAnalysis: {
    revenueBreakdown: any
    profitMargins: any[]
    revenueByCategory: any[]
    revenueGrowth: number
    forecastData: any[]
  }
  categoryAnalysis: {
    categoryPerformance: any[]
    categoryTrends: any[]
    categoryComparison: any[]
    marketShare: any[]
  }
  trendingProducts: {
    hotProducts: any[]
    risingStars: any[]
    decliningProducts: any[]
    newProducts: any[]
  }
}

export default function ProductAnalyticsPage() {
  const [data, setData] = useState<ProductAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [category, setCategory] = useState('all')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe, category])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics/products?timeframe=${timeframe}&category=${category}`)
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error fetching product analytics:', error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return <div>Error loading product analytics data</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Analytics</h1>
          <p className="text-gray-600">Sales metrics, inventory insights, and product performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Clothing">Clothing</SelectItem>
              <SelectItem value="Books">Books</SelectItem>
              <SelectItem value="Home">Home</SelectItem>
              <SelectItem value="Sports">Sports</SelectItem>
            </SelectContent>
          </Select>
          
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.salesOverview.totalProducts)}</div>
            <p className="text-xs text-muted-foreground">
              {data.salesOverview.activeProducts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(data.salesOverview.totalSales)}</div>
            <div className={`flex items-center text-xs ${getGrowthColor(data.salesOverview.salesGrowth)}`}>
              {getGrowthIcon(data.salesOverview.salesGrowth)}
              <span className="ml-1">{data.salesOverview.salesGrowth.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.salesOverview.totalRevenue)}</div>
            <div className={`flex items-center text-xs ${getGrowthColor(data.revenueAnalysis.revenueGrowth)}`}>
              {getGrowthIcon(data.revenueAnalysis.revenueGrowth)}
              <span className="ml-1">{data.revenueAnalysis.revenueGrowth.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(data.salesOverview.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(data.inventoryAnalytics.totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              total stock value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.inventoryAnalytics.lowStockProducts.length + data.inventoryAnalytics.outOfStockProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Top Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.salesOverview.topSellingProducts.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(product.price)}</div>
                        <div className="text-xs text-gray-500">{product.sales} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                    <div className="text-xl font-bold flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      {(data.productPerformance.performanceMetrics.averageRating || 0).toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Views</div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatNumber(data.productPerformance.performanceMetrics.totalViews || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Reviews</div>
                    <div className="text-xl font-bold text-purple-600">
                      {formatNumber(data.productPerformance.performanceMetrics.totalReviews || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Avg Price</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(data.productPerformance.performanceMetrics.averagePrice || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Gross Revenue</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(data.revenueAnalysis.revenueBreakdown.gross_revenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Discounts</span>
                  <span className="font-bold text-red-600">
                    -{formatCurrency(data.revenueAnalysis.revenueBreakdown.discounts)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Shipping</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(data.revenueAnalysis.revenueBreakdown.shipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Taxes (GST)</span>
                  <span className="font-bold text-purple-600">
                    {formatCurrency(data.revenueAnalysis.revenueBreakdown.taxes)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Net Revenue</span>
                  <span className="font-bold text-green-700">
                    {formatCurrency(data.revenueAnalysis.revenueBreakdown.net_revenue)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Stock Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Stock Levels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.inventoryAnalytics.stockLevels.map((level) => (
                  <div key={level.level}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{level.level}</span>
                      <span>{level.count} products</span>
                    </div>
                    <Progress 
                      value={(level.count / Math.max(...data.inventoryAnalytics.stockLevels.map(l => l.count))) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Rankings */}
            <Card>
              <CardHeader>
                <CardTitle>Product Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.productPerformance.productRankings.slice(0, 10).map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(product.views)} views • ⭐ {(product.rating || 0).toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{product.sales} sold</div>
                        <div className="text-xs text-green-600">{formatCurrency(product.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Views to Sales Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.productPerformance.viewsToSalesConversion.slice(0, 8).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatNumber(product.views)} views → {product.sales} sales
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          {product.conversionRate.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.inventoryAnalytics.lowStockProducts.slice(0, 8).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-yellow-600">
                          {product.quantity} left
                        </Badge>
                        <div className="text-xs text-gray-500">Min: {product.minQuantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Out of Stock */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Out of Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.inventoryAnalytics.outOfStockProducts.slice(0, 8).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          {product.sales} sold • {formatCurrency(product.price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          Out of Stock
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inventory by Category */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.inventoryAnalytics.inventoryByCategory.slice(0, 6).map((category) => (
                    <div key={category.category} className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{category.category}</div>
                      <div className="text-sm text-gray-600">{category.product_count} products</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(category.total_value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Favorites */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Customer Favorites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.productPerformance.customerFavorites.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          ⭐ {(product.rating || 0).toFixed(1)} ({product.reviewCount} reviews)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(product.price)}</div>
                        <div className="text-xs text-gray-500">{product.sales} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profit Margins */}
            <Card>
              <CardHeader>
                <CardTitle>Profit Margins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.revenueAnalysis.profitMargins.slice(0, 8).map((product) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500">
                          Cost: {formatCurrency(product.costPrice || 0)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{product.margin.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(product.profit)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.categoryAnalysis.categoryPerformance.map((category) => (
                    <div key={category.category} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{category.category}</h4>
                        <Badge variant="outline">{category.product_count} products</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Sales:</span>
                          <span className="font-bold ml-1">{formatNumber(category.total_sales || 0)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Rating:</span>
                          <span className="font-bold ml-1">⭐ {(category.avg_rating || 0).toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Views:</span>
                          <span className="font-bold ml-1">{formatNumber(category.total_views || 0)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Price:</span>
                          <span className="font-bold ml-1">{formatCurrency(category.avg_price || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Share */}
            <Card>
              <CardHeader>
                <CardTitle>Market Share by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.categoryAnalysis.marketShare.map((category) => (
                    <div key={category.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{category.category}</span>
                        <span>{category.market_share.toFixed(1)}%</span>
                      </div>
                      <Progress value={category.market_share} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">
                        Revenue: {formatCurrency(category.revenue || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hot Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-red-500" />
                  Hot Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.trendingProducts.hotProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(product.views)} views • ⭐ {(product.rating || 0).toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{product.sales} sold</div>
                        <div className="text-xs text-green-600">{formatCurrency(product.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rising Stars */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Rising Stars
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.trendingProducts.risingStars.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            New • {formatNumber(product.views)} views
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{product.sales} sold</div>
                        <div className="text-xs text-gray-600">{formatCurrency(product.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Declining Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.trendingProducts.decliningProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatNumber(product.views)} views • Low sales
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{product.sales} sold</div>
                        <div className="text-xs text-gray-600">{formatCurrency(product.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* New Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-500" />
                  New Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.trendingProducts.newProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-xs">
                          NEW
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            Added {new Date(product.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{product.sales} sold</div>
                        <div className="text-xs text-green-600">{formatCurrency(product.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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