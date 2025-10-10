'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Users,
  Package,
  CreditCard,
  Wallet,
  ArrowUp,
  ArrowDown,
  Equal,
  Eye,
  Filter,
  Search
} from 'lucide-react'

interface FinancialReportData {
  timeframe: string
  reportType: string
  granularity: string
  currency: string
  dateRange: { start: string; end: string }
  revenueAnalytics: {
    totalRevenue: number
    previousRevenue: number
    growthRate: number
    revenueBySource: any[]
    revenueByProduct: any[]
    revenueByRegion: any[]
    revenueByPaymentMethod: any[]
    averageOrderValue: number
    revenuePerUser: number
    monthlyRecurringRevenue: any
  }
  commissionAnalytics: {
    totalCommissions: number
    previousCommissions: number
    growthRate: number
    pendingCommissions: any
    paidCommissions: any
    averageCommissionPerUser: number
    commissionToRevenueRatio: number
  }
  payoutAnalytics: {
    totalPayouts: number
    previousPayouts: number
    growthRate: number
    pendingPayouts: any
    processedPayouts: any
    failedPayouts: any
    averagePayoutAmount: number
    payoutProcessingTime: number
  }
  profitabilityAnalysis: {
    grossProfit: number
    netProfit: number
    profitMargin: number
    returnOnInvestment: number
  }
  cashFlowAnalysis: {
    operatingCashFlow: number
    investingCashFlow: number
    financingCashFlow: number
    netCashFlow: number
    cashPosition: number
    cashConversionCycle: number
  }
  taxAnalytics: {
    totalTaxLiability: number
    taxDeductions: number
    taxCredits: number
    effectiveTaxRate: number
    taxCompliance: any
  }
  kpiMetrics: {
    customerLifetimeValue: number
    customerAcquisitionCost: number
    paybackPeriod: number
    churnRate: number
    revenuePerUser: number
    commissionEfficiency: number
    payoutEfficiency: number
  }
  financialHealth: {
    creditScore: number
    financialStability: any
    overallScore: number
  }
  generatedAt: string
}

export default function FinancialReportsPage() {
  const [data, setData] = useState<FinancialReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [reportType, setReportType] = useState('comprehensive')
  const [granularity, setGranularity] = useState('daily')
  const [currency, setCurrency] = useState('PKR')
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [timeframe, reportType, granularity, currency])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchReports, 60000) // Refresh every minute
      return () => clearInterval(interval)
    }
  }, [autoRefresh, timeframe, reportType, granularity, currency])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/financial/reports?timeframe=${timeframe}&type=${reportType}&granularity=${granularity}&currency=${currency}`
      )
      const reportData = await response.json()
      setData(reportData)
    } catch (error) {
      console.error('Error fetching financial reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchReports()
  }

  const handleExport = (format: string) => {
    console.log(`Exporting financial reports in ${format} format...`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (rate < 0) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Equal className="h-4 w-4 text-gray-600" />
  }

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'text-green-600'
    if (rate < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return <div>Error loading financial reports</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-gray-600">Comprehensive financial analytics and reporting</p>
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
          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('Excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
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

        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comprehensive">Comprehensive</SelectItem>
            <SelectItem value="revenue">Revenue Only</SelectItem>
            <SelectItem value="commission">Commission Only</SelectItem>
            <SelectItem value="payout">Payout Only</SelectItem>
            <SelectItem value="profitability">Profitability</SelectItem>
          </SelectContent>
        </Select>

        <Select value={granularity} onValueChange={setGranularity}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PKR">PKR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenueAnalytics.totalRevenue)}</div>
            <div className={`text-xs flex items-center ${getGrowthColor(data.revenueAnalytics.growthRate)}`}>
              {getGrowthIcon(data.revenueAnalytics.growthRate)}
              <span className="ml-1">{Math.abs(data.revenueAnalytics.growthRate).toFixed(1)}% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.profitabilityAnalysis.netProfit)}</div>
            <div className="text-xs text-gray-500">
              {(data.profitabilityAnalysis.profitMargin * 100).toFixed(1)}% margin
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.commissionAnalytics.totalCommissions)}</div>
            <div className={`text-xs flex items-center ${getGrowthColor(data.commissionAnalytics.growthRate)}`}>
              {getGrowthIcon(data.commissionAnalytics.growthRate)}
              <span className="ml-1">{Math.abs(data.commissionAnalytics.growthRate).toFixed(1)}% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Position</CardTitle>
            <Wallet className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.cashFlowAnalysis.cashPosition)}</div>
            <div className="text-xs text-gray-500">
              {formatCurrency(data.cashFlowAnalysis.netCashFlow)} net flow
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-2xl font-bold">{data.financialHealth.overallScore}/100</span>
              </div>
              <Progress value={data.financialHealth.overallScore} className="h-2" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{data.financialHealth.financialStability.rating}</div>
              <div className="text-sm text-gray-500">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{data.financialHealth.creditScore}</div>
              <div className="text-sm text-gray-500">Credit Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="payout">Payout</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="kpi">KPIs</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.revenueAnalytics.revenueBySource.map((source: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(source.amount)}</div>
                        <div className="text-xs text-gray-500">{source.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.revenueAnalytics.revenueByPaymentMethod.map((method: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(method.amount)}</div>
                        <div className="text-xs text-gray-500">{method.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue by Region */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.revenueAnalytics.revenueByRegion.map((region: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                        <span className="text-sm">{region.region}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(region.amount)}</div>
                        <div className="text-xs text-gray-500">{region.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Order Value</span>
                    <span className="text-sm font-medium">{formatCurrency(data.revenueAnalytics.averageOrderValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Revenue Per User</span>
                    <span className="text-sm font-medium">{formatCurrency(data.revenueAnalytics.revenuePerUser)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Recurring Revenue</span>
                    <span className="text-sm font-medium">{formatCurrency(data.revenueAnalytics.monthlyRecurringRevenue.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">MRR Growth</span>
                    <span className={`text-sm font-medium ${getGrowthColor(data.revenueAnalytics.monthlyRecurringRevenue.growth)}`}>
                      {data.revenueAnalytics.monthlyRecurringRevenue.growth}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commission" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commission Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Commissions</span>
                    <span className="text-lg font-bold">{formatCurrency(data.commissionAnalytics.totalCommissions)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Commissions</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {formatCurrency(data.commissionAnalytics.pendingCommissions.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Paid Commissions</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(data.commissionAnalytics.paidCommissions.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Commission Efficiency</span>
                    <span className="text-sm font-medium">
                      {(data.kpiMetrics.commissionEfficiency * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Avg Commission Per User</span>
                    <span className="text-sm font-medium">{formatCurrency(data.commissionAnalytics.averageCommissionPerUser)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Commission to Revenue Ratio</span>
                    <span className="text-sm font-medium">
                      {(data.commissionAnalytics.commissionToRevenueRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Count</span>
                    <span className="text-sm font-medium">{data.commissionAnalytics.pendingCommissions.count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Paid Count</span>
                    <span className="text-sm font-medium">{data.commissionAnalytics.paidCommissions.count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payout" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payout Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Payout Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Payouts</span>
                    <span className="text-lg font-bold">{formatCurrency(data.payoutAnalytics.totalPayouts)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Payouts</span>
                    <span className="text-sm font-medium text-yellow-600">
                      {formatCurrency(data.payoutAnalytics.pendingPayouts.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processed Payouts</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(data.payoutAnalytics.processedPayouts.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Failed Payouts</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(data.payoutAnalytics.failedPayouts.amount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payout Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Payout Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Payout Amount</span>
                    <span className="text-sm font-medium">{formatCurrency(data.payoutAnalytics.averagePayoutAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing Time</span>
                    <span className="text-sm font-medium">{data.payoutAnalytics.payoutProcessingTime} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Payout Efficiency</span>
                    <span className="text-sm font-medium">
                      {(data.kpiMetrics.payoutEfficiency * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      {(((data.payoutAnalytics.processedPayouts.count) / 
                        (data.payoutAnalytics.processedPayouts.count + data.payoutAnalytics.failedPayouts.count)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profitability Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Profitability Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gross Profit</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(data.profitabilityAnalysis.grossProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Net Profit</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(data.profitabilityAnalysis.netProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Profit Margin</span>
                    <span className="text-sm font-medium">
                      {(data.profitabilityAnalysis.profitMargin * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Return on Investment</span>
                    <span className="text-sm font-medium text-green-600">
                      {(data.profitabilityAnalysis.returnOnInvestment * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profitability Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Profitability Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  Profitability trend chart would go here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Operating Cash Flow</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(data.cashFlowAnalysis.operatingCashFlow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Investing Cash Flow</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatCurrency(data.cashFlowAnalysis.investingCashFlow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Financing Cash Flow</span>
                    <span className="text-sm font-medium text-blue-600">
                      {formatCurrency(data.cashFlowAnalysis.financingCashFlow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Net Cash Flow</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(data.cashFlowAnalysis.netCashFlow)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cash Position</span>
                    <span className="text-lg font-bold">{formatCurrency(data.cashFlowAnalysis.cashPosition)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cash Conversion Cycle</span>
                    <span className="text-sm font-medium">{data.cashFlowAnalysis.cashConversionCycle} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tax Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Tax Liability</span>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(data.taxAnalytics.totalTaxLiability)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tax Deductions</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(data.taxAnalytics.taxDeductions)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tax Credits</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(data.taxAnalytics.taxCredits)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Effective Tax Rate</span>
                    <span className="text-sm font-medium">
                      {(data.taxAnalytics.effectiveTaxRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Compliance */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compliance Status</span>
                    <Badge variant={data.taxAnalytics.taxCompliance.status === 'compliant' ? 'default' : 'destructive'}>
                      {data.taxAnalytics.taxCompliance.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compliance Score</span>
                    <span className="text-sm font-medium">{data.taxAnalytics.taxCompliance.score}/100</span>
                  </div>
                  <Progress value={data.taxAnalytics.taxCompliance.score} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kpi" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(data.kpiMetrics.customerLifetimeValue)}</div>
                <div className="text-xs text-gray-500">Average customer value</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Acquisition Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.kpiMetrics.customerAcquisitionCost)}</div>
                <div className="text-xs text-gray-500">Cost to acquire customer</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payback Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{data.kpiMetrics.paybackPeriod}</div>
                <div className="text-xs text-gray-500">Months to break even</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{(data.kpiMetrics.churnRate * 100).toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Monthly churn rate</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenue Per User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(data.kpiMetrics.revenuePerUser)}</div>
                <div className="text-xs text-gray-500">Monthly revenue per user</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Commission Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{(data.kpiMetrics.commissionEfficiency * 100).toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Commission processing efficiency</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  )
} 