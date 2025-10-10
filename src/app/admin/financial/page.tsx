'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  CreditCard,
  Wallet,
  PiggyBank,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'

interface FinancialData {
  revenue: {
    totalRevenue: number
    paidRevenue: number
    pendingRevenue: number
    voucherRevenue: number
    shippingRevenue: number
    orderCount: number
    averageOrderValue: number
    outstandingAmount: number
  }
  commissions: {
    totalCommissions: number
    pendingCommissions: number
    totalEarnings: number
    activeEarners: number
    commissionOrders: number
    averageCommissionPerOrder: number
  }
  payments: {
    paymentStatusStats: any[]
    paymentMethodStats: any[]
    failedPayments: number
    refundedAmount: number
    successRate: number
  }
  users: {
    totalUserBalance: number
    totalVoucherBalance: number
    usersWithBalance: number
    usersWithEarnings: number
    topBalanceUsers: any[]
  }
  trends: {
    revenue: any[]
    commissions: any[]
  }
  topEarners: any[]
  recentTransactions: any[]
}

export default function FinancialDashboard() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchFinancialData()
  }, [timeframe])

  const fetchFinancialData = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/admin/financial/dashboard?timeframe=${timeframe}`)
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
      } else {
        console.error('Failed to fetch financial data:', result.error)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email?.charAt(0).toUpperCase() || 'U'
  }

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 90 Days'
      case '1y': return 'Last Year'
      default: return 'All Time'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Unable to load financial data</h2>
        <p className="text-gray-600 mt-2">Please try again later.</p>
        <Button onClick={fetchFinancialData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Complete financial overview and management</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={fetchFinancialData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              {data.revenue.orderCount} orders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.revenue.paidRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Outstanding: {formatCurrency(data.revenue.outstandingAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.commissions.totalCommissions)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Pending: {formatCurrency(data.commissions.pendingCommissions)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Earners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.commissions.activeEarners}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Avg: {formatCurrency(data.commissions.averageCommissionPerOrder)}/order</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="commissions">Commission Management</TabsTrigger>
          <TabsTrigger value="payments">Payment Monitoring</TabsTrigger>
          <TabsTrigger value="users">User Finance</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Product Sales</span>
                  <span className="font-bold">{formatCurrency(data.revenue.totalRevenue - data.revenue.shippingRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Shipping Revenue</span>
                  <span className="font-bold">{formatCurrency(data.revenue.shippingRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Voucher Discounts</span>
                  <span className="font-bold text-red-600">-{formatCurrency(data.revenue.voucherRevenue)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Net Revenue</span>
                  <span className="font-bold text-lg">{formatCurrency(data.revenue.totalRevenue - data.revenue.voucherRevenue)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.payments.paymentStatusStats.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={status.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                        {status.paymentStatus}
                      </Badge>
                      <span className="text-sm">{status._count.id} orders</span>
                    </div>
                    <span className="font-medium">{formatCurrency(status._sum.totalPkr || 0)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="font-bold text-green-600">{formatPercentage(data.payments.successRate)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.payments.paymentMethodStats.map((method, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{method.paymentMethod}</span>
                      <CreditCard className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold">{formatCurrency(method._sum.totalPkr || 0)}</div>
                    <div className="text-sm text-gray-600">{method._count.id} transactions</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Management Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.commissions.totalCommissions)}</div>
                    <div className="text-sm text-blue-800">Total Earned</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{formatCurrency(data.commissions.pendingCommissions)}</div>
                    <div className="text-sm text-yellow-800">Pending Payout</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active Earners</span>
                    <span className="font-medium">{data.commissions.activeEarners}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission Orders</span>
                    <span className="font-medium">{data.commissions.commissionOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Commission/Order</span>
                    <span className="font-medium">{formatCurrency(data.commissions.averageCommissionPerOrder)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Earners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topEarners.slice(0, 5).map((earner, index) => (
                    <div key={earner.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={earner.avatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(earner.name, earner.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{earner.name || earner.username}</div>
                          <div className="text-xs text-gray-600">{earner.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{formatCurrency(earner.totalEarnings)}</div>
                        <div className="text-xs text-gray-600">
                          Pending: {formatCurrency(earner.pendingCommission)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Monitoring Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Success Rate</span>
                  </div>
                  <span className="font-bold text-green-600">{formatPercentage(data.payments.successRate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Failed Payments</span>
                  </div>
                  <span className="font-bold text-red-600">{data.payments.failedPayments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowDownRight className="w-4 h-4 text-gray-500" />
                    <span>Refunded Amount</span>
                  </div>
                  <span className="font-bold text-gray-600">{formatCurrency(data.payments.refundedAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Balances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-blue-500" />
                    <span>Total User Balance</span>
                  </div>
                  <span className="font-bold">{formatCurrency(data.users.totalUserBalance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="w-4 h-4 text-purple-500" />
                    <span>Total Voucher Balance</span>
                  </div>
                  <span className="font-bold">{formatCurrency(data.users.totalVoucherBalance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span>Users with Balance</span>
                  </div>
                  <span className="font-bold">{data.users.usersWithBalance}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentTransactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.status === 'PAID' ? 'bg-green-500' :
                          transaction.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span>{transaction.description}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Finance Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{data.users.usersWithBalance}</div>
                    <div className="text-sm text-green-800">With Balance</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{data.users.usersWithEarnings}</div>
                    <div className="text-sm text-blue-800">With Earnings</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total User Balance</span>
                    <span className="font-medium">{formatCurrency(data.users.totalUserBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Voucher Balance</span>
                    <span className="font-medium">{formatCurrency(data.users.totalVoucherBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Combined Balance</span>
                    <span className="font-medium">{formatCurrency(data.users.totalUserBalance + data.users.totalVoucherBalance)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Balance Holders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.users.topBalanceUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{user.name || user.username}</div>
                          <div className="text-xs text-gray-600">{user.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{formatCurrency(user.balance)}</div>
                        <div className="text-xs text-gray-600">
                          Earnings: {formatCurrency(user.totalEarnings)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 