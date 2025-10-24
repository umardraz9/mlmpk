'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Edit,
  DollarSign,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Plus,
  ArrowUpDown,
  User,
  PhoneCall,
  Mail
} from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  subtotalPkr: number
  voucherUsedPkr: number
  shippingPkr: number
  totalPkr: number
  paidAmountPkr: number
  status: string
  paymentMethod: string
  paymentStatus: string
  shippingAddress: string
  city: string
  trackingNumber: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    username: string | null
    avatar: string | null
    phone: string | null
  }
}

interface OrderAnalytics {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  totalRevenue: number
  paidAmount: number
  voucherUsed: number
  shippingRevenue: number
  monthlyRevenue: number
  monthlyOrders: number
  topCustomers: any[]
  recentOrders: any[]
}

export default function AdminOrdersPage() {
  const router = useRouter()
  

  const demoOrders = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      items: [
        { id: '1', name: 'Premium Headphones', price: 2500, quantity: 1, image: null },
        { id: '2', name: 'Phone Case', price: 500, quantity: 2, image: null }
      ],
      subtotalPkr: 3500,
      voucherUsedPkr: 500,
      shippingPkr: 200,
      totalPkr: 3200,
      paidAmountPkr: 3200,
      status: 'COMPLETED',
      paymentMethod: 'JazzCash',
      paymentStatus: 'PAID',
      shippingAddress: '123 Main St, Lahore',
      city: 'Lahore',
      trackingNumber: 'TRK123456',
      notes: 'Gift wrapped',
      createdAt: '2024-07-24T10:30:00Z',
      updatedAt: '2024-07-25T08:15:00Z',
      user: {
        id: '1',
        name: 'Ahmed Khan',
        email: 'ahmed@example.com',
        username: 'ahmedk',
        avatar: null,
        phone: '+923001234561'
      }
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      items: [
        { id: '3', name: 'Wireless Mouse', price: 1200, quantity: 1, image: null }
      ],
      subtotalPkr: 1200,
      voucherUsedPkr: 200,
      shippingPkr: 150,
      totalPkr: 1150,
      paidAmountPkr: 1000,
      status: 'PENDING',
      paymentMethod: 'EasyPaisa',
      paymentStatus: 'PENDING',
      shippingAddress: '45 Model Town, Karachi',
      city: 'Karachi',
      trackingNumber: null,
      notes: null,
      createdAt: '2024-07-25T09:15:00Z',
      updatedAt: '2024-07-25T09:15:00Z',
      user: {
        id: '2',
        name: 'Fatima Ali',
        email: 'fatima@example.com',
        username: 'fatimaa',
        avatar: null,
        phone: '+923001234562'
      }
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      items: [
        { id: '4', name: 'Laptop Bag', price: 1800, quantity: 1, image: null },
        { id: '5', name: 'USB Cable', price: 300, quantity: 3, image: null }
      ],
      subtotalPkr: 2700,
      voucherUsedPkr: 300,
      shippingPkr: 250,
      totalPkr: 2650,
      paidAmountPkr: 2650,
      status: 'SHIPPED',
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'PAID',
      shippingAddress: '78 Gulberg, Islamabad',
      city: 'Islamabad',
      trackingNumber: 'TRK789012',
      notes: 'Leave at reception',
      createdAt: '2024-07-23T14:20:00Z',
      updatedAt: '2024-07-24T16:45:00Z',
      user: {
        id: '3',
        name: 'Bilal Ahmed',
        email: 'bilal@example.com',
        username: 'bilala',
        avatar: null,
        phone: '+923001234563'
      }
    },
    {
      id: '4',
      orderNumber: 'ORD-2024-004',
      items: [
        { id: '6', name: 'Smart Watch', price: 8000, quantity: 1, image: null }
      ],
      subtotalPkr: 8000,
      voucherUsedPkr: 1000,
      shippingPkr: 300,
      totalPkr: 7300,
      paidAmountPkr: 7300,
      status: 'DELIVERED',
      paymentMethod: 'Credit Card',
      paymentStatus: 'PAID',
      shippingAddress: '12 DHA, Lahore',
      city: 'Lahore',
      trackingNumber: 'TRK345678',
      notes: 'Signature required',
      createdAt: '2024-07-22T11:30:00Z',
      updatedAt: '2024-07-24T10:00:00Z',
      user: {
        id: '4',
        name: 'Ayesha Malik',
        email: 'ayesha@example.com',
        username: 'ayesham',
        avatar: null,
        phone: '+923001234564'
      }
    },
    {
      id: '5',
      orderNumber: 'ORD-2024-005',
      items: [
        { id: '7', name: 'Bluetooth Speaker', price: 3200, quantity: 1, image: null },
        { id: '8', name: 'Charging Cable', price: 400, quantity: 2, image: null }
      ],
      subtotalPkr: 4000,
      voucherUsedPkr: 500,
      shippingPkr: 200,
      totalPkr: 3700,
      paidAmountPkr: 3700,
      status: 'PROCESSING',
      paymentMethod: 'JazzCash',
      paymentStatus: 'PAID',
      shippingAddress: '90 Clifton, Karachi',
      city: 'Karachi',
      trackingNumber: 'TRK567890',
      notes: 'Fragile items',
      createdAt: '2024-07-26T08:45:00Z',
      updatedAt: '2024-07-26T08:45:00Z',
      user: {
        id: '5',
        name: 'Zain Hassan',
        email: 'zain@example.com',
        username: 'zainh',
        avatar: null,
        phone: '+923001234565'
      }
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      items: [
        { id: '3', name: 'Wireless Mouse', price: 1200, quantity: 1, image: null }
      ],
      subtotalPkr: 1200,
      voucherUsedPkr: 200,
      shippingPkr: 150,
      totalPkr: 1150,
      paidAmountPkr: 1000,
      status: 'PENDING',
      paymentMethod: 'EasyPaisa',
      paymentStatus: 'PENDING',
      shippingAddress: '45 Model Town, Karachi',
      city: 'Karachi',
      trackingNumber: null,
      notes: null,
      createdAt: '2024-07-25T09:15:00Z',
      updatedAt: '2024-07-25T09:15:00Z',
      user: {
        id: '2',
        name: 'Fatima Ali',
        email: 'fatima@example.com',
        username: 'fatimaa',
        avatar: null,
        phone: '+923001234562'
      }
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      items: [
        { id: '4', name: 'Laptop Bag', price: 1800, quantity: 1, image: null },
        { id: '5', name: 'USB Cable', price: 300, quantity: 3, image: null }
      ],
      subtotalPkr: 2700,
      voucherUsedPkr: 300,
      shippingPkr: 250,
      totalPkr: 2650,
      paidAmountPkr: 2650,
      status: 'SHIPPED',
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'PAID',
      shippingAddress: '78 Gulberg, Islamabad',
      city: 'Islamabad',
      trackingNumber: 'TRK789012',
      notes: 'Leave at reception',
      createdAt: '2024-07-23T14:20:00Z',
      updatedAt: '2024-07-25T07:30:00Z',
      user: {
        id: '3',
        name: 'Usman Butt',
        email: 'usman@example.com',
        username: 'usmanb',
        avatar: null,
        phone: '+923001234563'
      }
    }
  ];

  const demoAnalytics = {
    totalOrders: 247,
    pendingOrders: 23,
    completedOrders: 198,
    cancelledOrders: 26,
    totalRevenue: 485000,
    paidAmount: 465000,
    voucherUsed: 35000,
    shippingRevenue: 18500,
    monthlyRevenue: 85000,
    monthlyOrders: 45,
    topCustomers: [],
    recentOrders: demoOrders
  };

  const [orders, setOrders] = useState<Order[]>(demoOrders)
  const [analytics, setAnalytics] = useState<any>(demoAnalytics)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [miniStats, setMiniStats] = useState({
    todayOrders: 0,
    thisWeekOrders: 0,
    thisMonthOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    topSellingItem: null as any,
    recentOrders: [] as any[]
  })

  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchTerm, statusFilter, paymentStatusFilter, dateFrom, dateTo])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentStatusFilter && { paymentStatus: paymentStatusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders)
        setAnalytics(data.analytics)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchOrders()
  }

  const handleQuickStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchOrders()
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'SHIPPED': return 'bg-purple-100 text-purple-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'REFUNDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Orders</h2>
          <p className="text-gray-600">Please wait while we fetch your order data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Order Management</h1>
                <p className="text-sm text-gray-600">Manage orders, payments, and shipping</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchOrders()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Enhanced Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Order Management Dashboard</h2>
                <p className="text-blue-100">Comprehensive overview of all customer orders and transactions</p>
              </div>
              <div className="hidden lg:flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <div className="text-blue-100">Total Orders</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Enhanced Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <div className="text-green-600 font-medium">{analytics.monthlyOrders} this month</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">{analytics.pendingOrders}</div>
                <div className="text-sm text-gray-600">Pending Orders</div>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <div className="text-orange-600 font-medium">Need attention</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <div className="text-green-600 font-medium">{formatCurrency(analytics.monthlyRevenue)} this month</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.totalOrders > 0
                    ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <div className="text-purple-600 font-medium">{analytics.completedOrders} completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Mini Data Insights */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-orange-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-orange-700">Total Orders:</span>
                <span className="font-bold text-orange-900">{analytics.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-orange-700">Pending:</span>
                <span className="font-bold text-orange-900">{analytics.pendingOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-orange-700">Completed:</span>
                <span className="font-bold text-orange-900">{analytics.completedOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-orange-700">Cancelled:</span>
                <span className="font-bold text-orange-900">{analytics.cancelledOrders}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-teal-900 mb-4">Revenue Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-teal-700">Total Revenue:</span>
                <span className="font-bold text-teal-900">{formatCurrency(analytics.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-teal-700">Paid Amount:</span>
                <span className="font-bold text-teal-900">{formatCurrency(analytics.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-teal-700">Voucher Used:</span>
                <span className="font-bold text-teal-900">{formatCurrency(analytics.voucherUsed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-teal-700">Avg Order Value:</span>
                <span className="font-bold text-teal-900">
                  {formatCurrency(analytics.totalRevenue / analytics.totalOrders)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-indigo-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-indigo-700">Completion Rate:</span>
                <span className="font-bold text-indigo-900">
                  {analytics.totalOrders > 0
                    ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-indigo-700">Monthly Orders:</span>
                <span className="font-bold text-indigo-900">{analytics.monthlyOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-indigo-700">Monthly Revenue:</span>
                <span className="font-bold text-indigo-900">{formatCurrency(analytics.monthlyRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Search & Filter Orders
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            💡 <strong>Tip:</strong> Search by Order Number (e.g., MCN1761313110137U5AZ), Customer Email, Customer Name, or City
          </p>
          
          {/* Quick Date Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={dateFrom === new Date().toISOString().split('T')[0] && dateTo === new Date().toISOString().split('T')[0] ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                setDateFrom(today)
                setDateTo(today)
                setCurrentPage(1)
              }}
              className="text-xs"
            >
              📅 Today
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
                setDateFrom(yesterday)
                setDateTo(yesterday)
                setCurrentPage(1)
              }}
              className="text-xs"
            >
              📆 Yesterday
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
                setDateFrom(weekStart.toISOString().split('T')[0])
                setDateTo(new Date().toISOString().split('T')[0])
                setCurrentPage(1)
              }}
              className="text-xs"
            >
              📊 This Week
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
                setDateFrom(monthStart.toISOString().split('T')[0])
                setDateTo(new Date().toISOString().split('T')[0])
                setCurrentPage(1)
              }}
              className="text-xs"
            >
              📈 This Month
            </Button>
            
            {(dateFrom || dateTo) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setCurrentPage(1)
                }}
                className="text-xs text-red-600 hover:text-red-700"
              >
                ✕ Clear Dates
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-blue-600" />
                <Input
                  placeholder="🔍 Enter Order #, Email, Name, or City..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-300 focus:border-blue-500"
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            
            {searchTerm && (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-sm text-blue-800">
                🔎 Searching for: <strong>"{searchTerm}"</strong>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="statusFilter">Order Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentStatusFilter">Payment Status</Label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All payment statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Payment Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Orders ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? `No orders match your search for "${searchTerm}". Try searching with:` 
                  : 'No orders available. Try adjusting your filters.'}
              </p>
              {searchTerm && (
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>✓ Order Number (e.g., MCN1761313110137U5AZ)</li>
                  <li>✓ Customer Email</li>
                  <li>✓ Customer Name</li>
                  <li>✓ City</li>
                </ul>
              )}
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setPaymentStatusFilter('')
                  setDateFrom('')
                  setDateTo('')
                  setCurrentPage(1)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(order.totalPkr)}</div>
                    <div className="text-sm text-gray-600">
                      Paid: {formatCurrency(order.paidAmountPkr)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Customer
                    </h4>
                    {order.user ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={order.user?.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(order.user?.name || null, order.user?.email || null)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {order.user?.name || order.user?.username || 'No Name'}
                            </div>
                            <div className="text-xs text-gray-600">{order.user?.email}</div>
                          </div>
                        </div>
                        {order.user?.phone && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.user.phone}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-600">Customer information not available</div>
                    )}
                  </div>

                  {/* Shipping Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Shipping
                    </h4>
                    <div className="text-sm text-gray-600">
                      <div>{order.shippingAddress}</div>
                      <div>{order.city}</div>
                      {order.trackingNumber && (
                        <div className="flex items-center mt-1">
                          <Truck className="w-3 h-3 mr-1" />
                          {order.trackingNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Items ({order.items.length})
                    </h4>
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{order.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    {order.status === 'PENDING' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickStatusUpdate(order.id, 'PROCESSING')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Processing
                      </Button>
                    )}
                    
                    {order.status === 'PROCESSING' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickStatusUpdate(order.id, 'SHIPPED')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Mark as Shipped
                      </Button>
                    )}
                    
                    {order.status === 'SHIPPED' && (
                      <Button
                        size="sm"
                        onClick={() => handleQuickStatusUpdate(order.id, 'DELIVERED')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className="w-10"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </main>
    </div>
  )
} 