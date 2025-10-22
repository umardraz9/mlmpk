'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Eye, Search, Filter, Banknote, Clock, CheckCircle, XCircle, DollarSign, CreditCard, Hash } from 'lucide-react'
import Image from 'next/image'

interface ManualPaymentRequest {
  id: string
  userId: string
  membershipTier: string
  amount: number
  paymentMethod: string
  adminAccount: string
  userPhone: string
  transactionId: string
  screenshot?: string
  status: string
  notes?: string
  createdAt: string
  approvedAt?: string
  approvedBy?: string
  user: {
    name: string
    email: string
  }
  approver?: {
    name: string
    email: string
  }
}

interface ExtendedUser {
  name?: string | null
  email?: string | null
  image?: string | null
  isAdmin?: boolean
  role?: string
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}

// Generate order number from payment ID and date
function generateOrderNumber(paymentId: string, createdAt: string) {
  if (!paymentId || !createdAt) return 'N/A'
  const date = new Date(createdAt)
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const shortId = paymentId.slice(-6).toUpperCase()
  return `MCN${year}${month}${day}-${shortId}`
}

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [payments, setPayments] = useState<ManualPaymentRequest[]>([])
  const [filteredPayments, setFilteredPayments] = useState<ManualPaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<ManualPaymentRequest | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')
  const [actionNotes, setActionNotes] = useState('')

  const user = session?.user as ExtendedUser | undefined

  const fetchPayments = async () => {
    try {
      setLoading(true)

      if (!user?.isAdmin) {
        console.log('Unauthorized: Admin access required for payment fetch')
        return
      }
        
      const response = await fetch('/api/admin/payments')
      const data = await response.json()
      
      if (response.ok && data.payments) {
        setPayments(data.payments)
        setFilteredPayments(data.payments)
      } else {
        console.error('Failed to fetch payments:', data.error)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Redirect unauthenticated users to admin login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [status, router])

  // Load payments only when authenticated admin
  useEffect(() => {
    if (status === 'authenticated' && user?.isAdmin) {
      fetchPayments()
    }
  }, [status, user?.isAdmin])

  // Loading state while session or payments are loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin session...</p>
        </div>
      </div>
    )
  }

  // Filter payments based on search term and filters
  useEffect(() => {
    let filtered = payments

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(payment => 
        payment.user?.name?.toLowerCase().includes(searchLower) ||
        payment.user?.email?.toLowerCase().includes(searchLower) ||
        payment.userPhone?.includes(searchTerm) ||
        payment.transactionId?.toLowerCase().includes(searchLower) ||
        payment.id.toLowerCase().includes(searchLower) ||
        generateOrderNumber(payment.id, payment.createdAt).toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter.toUpperCase())
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === paymentMethodFilter)
    }

    setFilteredPayments(filtered)
  }, [payments, searchTerm, statusFilter, paymentMethodFilter])

  // Get unique payment methods for filter dropdown
  const uniquePaymentMethods = Array.from(new Set(payments.map(p => p?.paymentMethod).filter(Boolean)))

  const handleApprove = async (paymentId: string, notes: string = '') => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, action: 'approve', notes })
      })
      
      if (response.ok) {
        fetchPayments()
        setSelectedPayment(null)
        setActionNotes('')
      } else {
        const errorData = await response.json()
        alert(`Failed to approve payment: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error approving payment:', error)
      alert('Network error while approving payment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (paymentId: string, notes: string = '') => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentId, action: 'reject', notes })
      })
      
      if (response.ok) {
        fetchPayments()
        setSelectedPayment(null)
        setActionNotes('')
      } else {
        const errorData = await response.json()
        alert(`Failed to reject payment: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error rejecting payment:', error)
      alert('Network error while rejecting payment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'default' as const, icon: Clock, color: 'text-yellow-600' },
      APPROVED: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      REJECTED: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className={`w-3 h-3 ${config.color}`} />
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'authenticated' && !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
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
                onClick={() => router.push('/admin')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Payment Management</h1>
                <p className="text-sm text-gray-600">Review and manage manual payment requests</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-4">
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">{payments.length} Total</span>
                  </div>
                </div>
                <div className="bg-yellow-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-yellow-700">
                      {payments.filter(p => p?.status === 'PENDING').length} Pending
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Payment Management Dashboard</h2>
                <p className="text-green-100">Comprehensive payment processing and verification system</p>
              </div>
              <div className="hidden lg:flex items-center space-x-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {payments.filter(p => p?.status === 'APPROVED').length}
                  </div>
                  <div className="text-green-100">Approved</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {uniquePaymentMethods.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setPaymentMethodFilter('all')
              }}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payments...</p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payment requests found</h3>
              <p className="text-gray-600">No payments match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-32">Order ID</TableHead>
                    <TableHead className="min-w-40">User</TableHead>
                    <TableHead className="min-w-24 hidden sm:table-cell">Membership</TableHead>
                    <TableHead className="min-w-24">Amount</TableHead>
                    <TableHead className="min-w-32 hidden md:table-cell">Method</TableHead>
                    <TableHead className="min-w-20">Status</TableHead>
                    <TableHead className="min-w-24 hidden lg:table-cell">Date</TableHead>
                    <TableHead className="min-w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  payment && (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs sm:text-sm">
                      <span className="block sm:hidden">{generateOrderNumber(payment.id, payment.createdAt).slice(-8)}</span>
                      <span className="hidden sm:block">{generateOrderNumber(payment.id, payment.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{payment.user?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">{payment.user?.email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">{payment.membershipTier || '-'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      <span className="block sm:hidden">₨{Math.round(payment.amount/1000)}k</span>
                      <span className="hidden sm:block">{formatCurrency(payment.amount)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm">{payment.paymentMethod || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status || 'PENDING')}
                    </TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                        className="flex items-center gap-1 text-xs p-2"
                      >
                        <Eye className="w-3 h-3" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                ))}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Payment Request Details</DialogTitle>
                <DialogDescription className="text-base text-gray-600 mt-1">
                  Review and manage this payment request
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedPayment?.status ?? 'PENDING')}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPayment(null)}
                  className="h-8 w-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-8 mt-6">
              {/* Payment Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Order Number</p>
                      <p className="text-lg font-bold text-blue-900 font-mono">
                        {generateOrderNumber(selectedPayment.id, selectedPayment.createdAt)}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Amount</p>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(selectedPayment.amount)}
                      </p>
                    </div>
                    <div className="p-2 bg-green-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Method</p>
                      <p className="text-lg font-bold text-purple-900">
                        {selectedPayment.paymentMethod}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Status</p>
                      <p className="text-lg font-bold text-orange-900">
                        {selectedPayment.status}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">User</label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {selectedPayment.user?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedPayment.user?.email || ''}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {selectedPayment.userPhone || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Membership Tier</label>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300">
                          {selectedPayment.membershipTier || '-'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Submitted</label>
                      <p className="text-base font-semibold text-gray-900 mt-1">
                        {formatDate(selectedPayment.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Payment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Method</label>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <span className="text-base font-semibold text-gray-900">
                          {selectedPayment.paymentMethod || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Admin Account</label>
                      <p className="text-base font-mono font-semibold text-gray-900 mt-1 bg-gray-50 p-2 rounded border">
                        {selectedPayment.adminAccount || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                      <p className="text-base font-mono font-semibold text-gray-900 mt-1 bg-gray-50 p-2 rounded border">
                        {selectedPayment.transactionId || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Screenshot */}
              {selectedPayment.screenshot && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    Payment Screenshot
                  </h3>
                  <div className="flex justify-center">
                    <div className="relative group">
                      <img
                        src={selectedPayment.screenshot}
                        alt="Payment Screenshot"
                        className="max-w-full h-auto rounded-lg border shadow-lg transition-transform group-hover:scale-105"
                        style={{ maxHeight: '400px' }}
                      />
                      <button
                        onClick={() => {
                          setSelectedImage(selectedPayment.screenshot || '');
                          setShowImageModal(true);
                        }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* User Notes */}
              {selectedPayment.notes && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    User Notes
                  </h3>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">
                      {selectedPayment.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {selectedPayment?.status === 'PENDING' && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    Admin Actions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes
                      </label>
                      <textarea
                        className="w-full min-h-[100px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                        placeholder="Add notes for this action (optional)..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => handleApprove(selectedPayment.id, actionNotes)}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Approve Payment
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(selectedPayment.id, actionNotes)}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2-2-2m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Reject Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Info */}
              {selectedPayment.status !== 'PENDING' && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {selectedPayment.status === 'APPROVED' ? 'Approval' : 'Rejection'} Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedPayment.approvedAt && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <label className="text-sm font-medium text-green-700">
                          {selectedPayment.status === 'APPROVED' ? 'Approved' : 'Rejected'} Date
                        </label>
                        <p className="text-base font-semibold text-green-900 mt-1">
                          {formatDate(selectedPayment.approvedAt)}
                        </p>
                      </div>
                    )}
                    {selectedPayment.approver && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <label className="text-sm font-medium text-blue-700">
                          {selectedPayment.status === 'APPROVED' ? 'Approved' : 'Rejected'} By
                        </label>
                        <p className="text-base font-semibold text-blue-900 mt-1">
                          {selectedPayment.approver.name}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          {selectedPayment.approver.email}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedPayment.notes && (
                    <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                      <label className="text-sm font-medium text-amber-700">Admin Notes</label>
                      <p className="text-sm text-amber-900 mt-2 whitespace-pre-wrap">
                        {selectedPayment.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-gray-900">Payment Screenshot</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageModal(false)}
                className="h-8 w-8 p-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center items-center min-h-[60vh]">
              <div className="relative group max-w-full max-h-[70vh]">
                <img
                  src={selectedImage}
                  alt="Payment Screenshot"
                  className="max-w-full max-h-full object-contain rounded-lg border-2 border-gray-200 shadow-2xl"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedImage;
                    link.download = 'payment-screenshot.jpg';
                    link.click();
                  }}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to download full size
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </main>
    </div>
  )
}
