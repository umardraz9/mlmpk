'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Package, 
  XCircle, 
  Edit, 
  CheckCircle, 
  ShoppingCart, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Truck,
  Loader2,
  History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface OrderDetails {
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
    firstName: string | null
    lastName: string | null
    phone: string | null
    avatar: string | null
    balance: number
    totalEarnings: number
    referralCode: string
    sponsor: {
      id: string
      name: string | null
      email: string | null
      username: string | null
      referralCode: string
    } | null
  }
  manualPayments?: {
    id: string
    amount: number
    status: string
    transactionId: string | null
    paymentProof: string | null
    createdAt: string
    verifiedAt: string | null
  }[]
  orderHistory: Array<{ id: string; orderNumber: string; createdAt: string; status: string; totalPkr: number }>
}

type FormDataType = {
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | string;
  trackingNumber: string;
  notes: string;
  shippingAddress: string;
  city: string;
  paidAmountPkr: number;
  shippingPkr: number;
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [paymentActionLoading, setPaymentActionLoading] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormDataType>({
    status: '',
    paymentStatus: '',
    trackingNumber: '',
    notes: '',
    shippingAddress: '',
    city: '',
    paidAmountPkr: 0,
    shippingPkr: 0
  })


  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/orders/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setOrderDetails(data)
        setFormData({
          status: data.status,
          paymentStatus: data.paymentStatus,
          trackingNumber: data.trackingNumber || '',
          notes: data.notes || '',
          shippingAddress: data.shippingAddress,
          city: data.city,
          paidAmountPkr: data.paidAmountPkr,
          shippingPkr: data.shippingPkr
        })
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchOrderDetails()
    }
  }, [params.id, fetchOrderDetails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setOrderDetails(data)
        setEditing(false)
        alert('Order updated successfully')
      } else {
        alert(data.error || 'Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = <K extends keyof FormDataType>(field: K, value: FormDataType[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePaymentAction = async (manualPaymentId: string, action: 'approve' | 'reject') => {
    try {
      setPaymentActionLoading(`${manualPaymentId}:${action}`)
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: manualPaymentId, action })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to process payment action')
      } else {
        await fetchOrderDetails()
      }
    } catch (e) {
      console.error('Payment action failed', e)
      alert('Network error while processing payment action')
    } finally {
      setPaymentActionLoading(null)
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
      month: 'long',
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
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email?.charAt(0).toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Order Details</h2>
          <p className="text-gray-600">Please wait while we fetch your order information</p>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or has been removed.</p>
          <Button
            onClick={() => router.push('/admin/orders')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Order #{orderDetails.orderNumber}</h1>
                <p className="text-sm text-gray-600">Order details and management</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <div className={`w-2 h-2 rounded-full ${
                  orderDetails.status === 'COMPLETED' ? 'bg-green-500' :
                  orderDetails.status === 'PENDING' ? 'bg-yellow-500' :
                  orderDetails.status === 'PROCESSING' ? 'bg-blue-500' :
                  'bg-gray-500'
                } animate-pulse`}></div>
                <span className="text-sm font-medium text-gray-700">{orderDetails.status}</span>
              </div>

              {!editing ? (
                <Button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Order</span>
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Order Management</h2>
                <p className="text-blue-100">Comprehensive order details and management tools</p>
              </div>
              <div className="hidden lg:flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Package className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(orderDetails.totalPkr)}</div>
                  <div className="text-blue-100">Total Value</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Enhanced Order Overview */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          Order Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Order Status</h3>
                <div className="mt-1">
                  {editing ? (
                    <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(orderDetails.status)}>
                      {orderDetails.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Payment Status</h3>
                <div className="mt-1">
                  {editing ? (
                    <Select value={formData.paymentStatus} onValueChange={(value) => handleChange('paymentStatus', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getPaymentStatusColor(orderDetails.paymentStatus)}>
                      {orderDetails.paymentStatus}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">Method: {orderDetails.paymentMethod}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Order Date</h3>
                <p className="text-sm text-gray-600 mt-1">{formatDate(orderDetails.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Total Amount</h3>
                <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(orderDetails.totalPkr)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Customer Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            Customer Information
          </h2>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={orderDetails.user.avatar || undefined} />
                <AvatarFallback className="text-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  {getInitials(orderDetails.user.name, orderDetails.user.email)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">
                  {orderDetails.user.name ||
                   `${orderDetails.user.firstName || ''} ${orderDetails.user.lastName || ''}`.trim() ||
                   'No Name'}
                </h3>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {orderDetails.user.email}
                  </div>
                  {orderDetails.user.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {orderDetails.user.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Balance</div>
                <div className="text-lg font-bold text-blue-900">{formatCurrency(orderDetails.user.balance)}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Total Earnings</div>
                <div className="text-lg font-bold text-green-900">{formatCurrency(orderDetails.user.totalEarnings)}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Referral Code</div>
                <div className="text-sm font-bold text-purple-900">{orderDetails.user.referralCode}</div>
              </div>
              {orderDetails.user.sponsor && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">Sponsor</div>
                  <div className="text-sm font-bold text-orange-900">
                    {orderDetails.user.sponsor.name || orderDetails.user.sponsor.email}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Shipping Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            Shipping Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Address</label>
              {editing ? (
                <Textarea
                  value={formData.shippingAddress}
                  onChange={(e) => handleChange('shippingAddress', e.target.value)}
                  rows={3}
                  className="w-full"
                  placeholder="Enter shipping address"
                />
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm text-gray-900">{orderDetails.shippingAddress}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              {editing ? (
                <Input
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm text-gray-900">{orderDetails.city}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
              {editing ? (
                <Input
                  value={formData.trackingNumber}
                  onChange={(e) => handleChange('trackingNumber', e.target.value)}
                  placeholder="Enter tracking number"
                />
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {orderDetails.trackingNumber || 'No tracking number'}
                    </span>
                  </div>
                  {orderDetails.trackingNumber && (
                    <Button variant="outline" size="sm" className="text-xs">
                      Track
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderDetails.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
                <div className="font-semibold">
                  {formatCurrency(item.quantity * item.price)}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(orderDetails.subtotalPkr)}</span>
              </div>
              
              {orderDetails.voucherUsedPkr > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Voucher Used:</span>
                  <span>-{formatCurrency(orderDetails.voucherUsedPkr)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Shipping:</span>
                {editing ? (
                  <Input
                    type="number"
                    value={formData.shippingPkr}
                    onChange={(e) => handleChange('shippingPkr', parseFloat(e.target.value) || 0)}
                    className="w-24 text-right"
                  />
                ) : (
                  <span>{formatCurrency(orderDetails.shippingPkr)}</span>
                )}
              </div>
              
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(orderDetails.totalPkr)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Paid Amount:</span>
                {editing ? (
                  <Input
                    type="number"
                    value={formData.paidAmountPkr}
                    onChange={(e) => handleChange('paidAmountPkr', parseFloat(e.target.value) || 0)}
                    className="w-24 text-right"
                  />
                ) : (
                  <span className="text-green-600 font-medium">
                    {formatCurrency(orderDetails.paidAmountPkr)}
                  </span>
                )}
              </div>
              
              {orderDetails.totalPkr > orderDetails.paidAmountPkr && (
                <div className="flex justify-between text-red-600">
                  <span>Outstanding:</span>
                  <span className="font-medium">
                    {formatCurrency(orderDetails.totalPkr - orderDetails.paidAmountPkr)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Manual Payment Proofs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Linked Manual Payment Proofs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orderDetails.manualPayments && orderDetails.manualPayments.length > 0 ? (
            <div className="space-y-3">
              {orderDetails.manualPayments.map((mp) => (
                <div key={mp.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">PKR {mp.amount.toLocaleString()}</span>
                      <Badge className={
                        mp.status === 'VERIFIED' ? 'bg-green-100 text-green-800'
                        : mp.status === 'REJECTED' ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }>
                        {mp.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {mp.transactionId ? <>Txn: {mp.transactionId} • </> : null}
                      Submitted: {formatDate(mp.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mp.paymentProof && (
                      <a href={mp.paymentProof} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">View Proof</Button>
                      </a>
                    )}
                    {mp.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={Boolean(paymentActionLoading)}
                          onClick={() => handlePaymentAction(mp.id, 'approve')}
                        >
                          {paymentActionLoading === `${mp.id}:approve` ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={Boolean(paymentActionLoading)}
                          onClick={() => handlePaymentAction(mp.id, 'reject')}
                        >
                          {paymentActionLoading === `${mp.id}:reject` ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" /> Reject
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No linked manual payments for this order.</p>
          )}
        </CardContent>
      </Card>

      {/* Notes and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add notes about this order..."
                rows={4}
              />
            ) : (
              <p className="text-sm text-gray-600">
                {orderDetails.notes || 'No notes added'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="w-5 h-5 mr-2" />
              Customer Order History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderDetails.orderHistory.length > 0 ? (
                orderDetails.orderHistory.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">#{order.orderNumber}</div>
                      <div className="text-xs text-gray-600">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(order.totalPkr)}</div>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No previous orders found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </main>
    </div>
  )
}