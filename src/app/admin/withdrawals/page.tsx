'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Filter,
  RefreshCw,
  Download,
  Search,
  Calendar,
  User,
  Phone,
  Mail,
  Banknote,
  TrendingUp
} from 'lucide-react'

interface WithdrawalRequest {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    phone: string
    username: string
    avatar?: string
  }
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  paymentMethod: 'JAZZCASH' | 'EASYPAYSA' | 'BANK_TRANSFER'
  paymentDetails: {
    accountNumber: string
    accountTitle: string
    bankName?: string
    jazzcashNumber?: string
    easypaisaNumber?: string
  }
  requestedAt: string
  processedAt?: string
  processedBy?: string
  rejectionReason?: string
  transactionId?: string
  notes?: string
}

interface WithdrawalStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  completedRequests: number
  totalAmount: number
  pendingAmount: number
  approvedAmount: number
  completedAmount: number
  averageProcessingTime: string
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [stats, setStats] = useState<WithdrawalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'JAZZCASH' | 'EASYPAYSA' | 'BANK_TRANSFER'>('all')
  const [dateRange, setDateRange] = useState('30d')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [statusFilter, paymentMethodFilter, dateRange])

  const fetchWithdrawals = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentMethodFilter !== 'all' && { paymentMethod: paymentMethodFilter }),
        dateRange
      })

      const [withdrawalsResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/withdrawals?${params}`),
        fetch(`/api/admin/withdrawals/stats?${params}`)
      ])

      const [withdrawalsData, statsData] = await Promise.all([
        withdrawalsResponse.json(),
        statsResponse.json()
      ])

      if (withdrawalsResponse.ok) setWithdrawals(withdrawalsData.withdrawals || [])
      if (statsResponse.ok) setStats(statsData)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (withdrawalId: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED', extra?: string) => {
    try {
      setProcessing(withdrawalId)
      const payload: any = { status }
      if (status === 'REJECTED' && extra) payload.rejectionReason = extra
      if (status === 'COMPLETED' && extra) payload.transactionId = extra

      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        fetchWithdrawals()
      }
    } catch (error) {
      console.error('Error updating withdrawal status:', error)
    } finally {
      setProcessing(null)
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
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const searchLower = searchTerm.toLowerCase()
    return (
      withdrawal.user.name.toLowerCase().includes(searchLower) ||
      withdrawal.user.email.toLowerCase().includes(searchLower) ||
      withdrawal.user.phone.toLowerCase().includes(searchLower) ||
      withdrawal.user.username.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Withdrawal Management</h1>
          <p className="text-gray-600">Manage and process user withdrawal requests</p>
        </div>
        <Button onClick={fetchWithdrawals} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
              <div className="text-2xl font-bold text-gray-900">{stats.totalRequests}</div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Amount</CardTitle>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Approved Amount</CardTitle>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.approvedAmount)}</div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Amount</CardTitle>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.completedAmount)}</div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentMethodFilter} onValueChange={(value) => setPaymentMethodFilter(value as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="JAZZCASH">JazzCash</SelectItem>
            <SelectItem value="EASYPAYSA">EasyPaisa</SelectItem>
            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Account Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={withdrawal.user.avatar} />
                          <AvatarFallback>
                            {withdrawal.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{withdrawal.user.name}</div>
                          <div className="text-sm text-gray-600">{withdrawal.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-lg">{formatCurrency(withdrawal.amount)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{withdrawal.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{withdrawal.paymentDetails.accountTitle}</div>
                        <div className="text-gray-600">{withdrawal.paymentDetails.accountNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell>{formatDate(withdrawal.requestedAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {withdrawal.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={processing === withdrawal.id}
                              onClick={() => handleStatusUpdate(withdrawal.id, 'APPROVED')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={processing === withdrawal.id}
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:')
                                if (reason) handleStatusUpdate(withdrawal.id, 'REJECTED', reason)
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {withdrawal.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="default"
                            disabled={processing === withdrawal.id}
                            onClick={() => {
                              const transactionId = prompt('Enter transaction ID/reference:')
                              if (transactionId) handleStatusUpdate(withdrawal.id, 'COMPLETED', transactionId)
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
