'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Database
} from 'lucide-react';

type TopProduct = {
  productName?: string;
  productId?: string;
  _sum: {
    quantity?: number;
    totalPrice?: number;
  };
};

type SalesByStatus = {
  status: string;
  _count: { status: number };
  _sum: { totalPkr?: number };
};

interface AnalyticsData {
  overview: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalCustomers: number;
    newCustomers: number;
    repeatCustomers: number;
  };
  topProducts: TopProduct[];
  salesByStatus: SalesByStatus[];
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const isAdminUser = Boolean((session as any)?.user?.isAdmin);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/sales?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (isAdminUser) {
      fetchAnalytics();
    }
  }, [isAdminUser, fetchAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PK').format(num);
  };

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Admin access required to view analytics.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Monitor your eCommerce performance and growth</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform analytics and insights</p>
        </div>
        <div className="w-full md:w-64">
          <Select value={period} onValueChange={(v) => setPeriod(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData?.overview.totalCustomers || 0)}</div>
            <p className="text-xs text-muted-foreground">New: {formatNumber(analyticsData?.overview.newCustomers || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData?.overview.totalSales || 0)}</div>
            <p className="text-xs text-muted-foreground">Period: {analyticsData?.period.days} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData?.overview.totalOrders || 0)}</div>
            <p className="text-xs text-muted-foreground">Avg value: {formatCurrency(analyticsData?.overview.averageOrderValue || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData?.overview.averageOrderValue || 0)}</div>
            <p className="text-xs text-muted-foreground">Repeat: {formatNumber(analyticsData?.overview.repeatCustomers || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Customers</span>
                <span className="font-bold">{formatNumber(analyticsData?.overview.totalCustomers || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">New Customers</span>
                <span className="font-bold">{formatNumber(analyticsData?.overview.newCustomers || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Repeat Customers</span>
                <span className="font-bold">{formatNumber(analyticsData?.overview.repeatCustomers || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Sales by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData?.salesByStatus?.map((s: SalesByStatus, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="capitalize">{s.status.toLowerCase()}</span>
                  <span className="text-gray-600">{formatNumber(s._count.status)} • {formatCurrency(s._sum.totalPkr || 0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Blog Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Posts</span>
                <span className="font-bold">{formatNumber(23)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Published</span>
                <span className="font-bold">{formatNumber(21)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Views</span>
                <span className="font-bold">{formatNumber(3400)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Engagement Rate</span>
                <span className="font-bold text-green-600">7.2%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-sm mb-2">Top Posts</h4>
              {[
                { title: 'How to Start with MLM', views: 450 },
                { title: 'Top 10 Earning Strategies', views: 380 },
                { title: 'Beginner Guide', views: 320 }
              ].map((post, index) => (
                <div key={index} className="flex justify-between py-1 text-sm">
                  <span className="truncate">{post.title}</span>
                  <span className="font-medium">{formatNumber(post.views)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData?.topProducts?.slice(0, 5).map((p: TopProduct, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="truncate">{p.productName || p.productId}</span>
                  <span className="text-gray-600">{formatNumber(p._sum.quantity || 0)} • {formatCurrency(p._sum.totalPrice || 0)}</span>
                </div>
              ))}
              {!analyticsData?.topProducts?.length && (
                <div className="text-sm text-gray-500">No product sales in selected period.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              MLM Network Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Network Size</span>
                <span className="font-bold">{formatNumber(156)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Sponsors</span>
                <span className="font-bold">{formatNumber(89)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Commissions</span>
                <span className="font-bold">{formatCurrency(185000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Growth Rate</span>
                <span className="font-bold text-green-600">+22.1%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-sm mb-2">Commission by Level</h4>
              {[
                { level: 'Level 1', amount: 45000, rate: '20%' },
                { level: 'Level 2', amount: 32000, rate: '15%' },
                { level: 'Level 3', amount: 18000, rate: '10%' },
                { level: 'Level 4', amount: 12000, rate: '8%' },
                { level: 'Level 5', amount: 8000, rate: '7%' }
              ].map((level, index) => (
                <div key={index} className="flex justify-between py-1 text-sm">
                  <span>{level.level}</span>
                  <span className="text-gray-600">{formatCurrency(level.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Revenue</span>
                <span className="font-bold">{formatCurrency(analyticsData?.overview.totalSales || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Orders</span>
                <span className="font-bold">{formatNumber(analyticsData?.overview.totalOrders || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average Order Value</span>
                <span className="font-bold">{formatCurrency(analyticsData?.overview.averageOrderValue || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Repeat Customers</span>
                <span className="font-bold">{formatNumber(analyticsData?.overview.repeatCustomers || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Uptime</span>
                <span className="font-bold text-green-600">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Response Time</span>
                <span className="font-bold">145ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Error Rate</span>
                <span className="font-bold text-green-600">0.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Health Score</span>
                <span className="font-bold text-green-600">95/100</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-sm mb-2">Database Stats</h4>
              {[
                { metric: 'Total Records', value: '12,450' },
                { metric: 'Active Sessions', value: '23' },
                { metric: 'API Calls/Hour', value: '1,247' },
                { metric: 'Cache Hit Rate', value: '94.2%' }
              ].map((stat, index) => (
                <div key={index} className="flex justify-between py-1 text-sm">
                  <span>{stat.metric}</span>
                  <span className="text-gray-600">{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
