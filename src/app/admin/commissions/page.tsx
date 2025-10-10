'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, 
  Search, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  UserCheck,
  Target,
  ArrowUpRight,
  Filter,
  Download,
  Send
} from 'lucide-react'

interface CommissionUser {
  id: string
  name: string | null
  email: string | null
  username: string | null
  avatar: string | null
  totalEarnings: number
  pendingCommission: number
  balance: number
  referralCode: string
  sponsor: {
    id: string
    name: string | null
    email: string | null
    username: string | null
    referralCode: string
  } | null
  referralCount: number
  totalReferralEarnings: number
  createdAt: string
  updatedAt: string
}

interface CommissionSummary {
  totalPendingCommissions: number
  totalPaidCommissions: number
  totalActiveEarners: number
  totalCommissionBalance: number
  monthlyCommissions: number
  topPerformer: any
  averageCommissionPerUser: number
}

export default function CommissionManagementPage() {
  const [users, setUsers] = useState<CommissionUser[]>([])
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('totalEarnings')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutType, setPayoutType] = useState('pending')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchCommissionData()
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder])

  const fetchCommissionData = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/admin/financial/commissions?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
        setSummary(data.summary)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching commission data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCommissionData()
  }

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleProcessPayouts = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to process payouts')
      return
    }

    if (payoutType === 'custom' && (!payoutAmount || parseFloat(payoutAmount) <= 0)) {
      alert('Please enter a valid payout amount')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/financial/commissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          payoutType,
          amount: payoutType === 'custom' ? parseFloat(payoutAmount) : undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Processed ${data.summary.successful} payouts successfully. ${data.summary.failed} failed.`)
        setSelectedUsers([])
        setPayoutAmount('')
        fetchCommissionData()
      } else {
        alert(data.error || 'Failed to process payouts')
      }
    } catch (error) {
      console.error('Error processing payouts:', error)
      alert('Failed to process payouts')
    } finally {
      setProcessing(false)
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
      day: 'numeric'
    })
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email?.charAt(0).toUpperCase() || 'U'
  }

  const getTotalSelectedPayout = () => {
    if (payoutType === 'custom') {
      return selectedUsers.length * parseFloat(payoutAmount || '0')
    }
    return selectedUsers.reduce((total, userId) => {
      const user = users.find(u => u.id === userId)
      return total + (user?.pendingCommission || 0)
    }, 0)
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-600">Manage MLM commissions and process payouts</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPendingCommissions)}</div>
              <p className="text-xs text-muted-foreground">
                Ready for payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaidCommissions)}</div>
              <p className="text-xs text-muted-foreground">
                All time payouts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Earners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalActiveEarners}</div>
              <p className="text-xs text-muted-foreground">
                Users with earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Commissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.monthlyCommissions)}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, username, or referral code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="statusFilter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="pending">With Pending Commission</SelectItem>
                    <SelectItem value="paid">With Total Earnings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalEarnings">Total Earnings</SelectItem>
                    <SelectItem value="pendingCommission">Pending Commission</SelectItem>
                    <SelectItem value="balance">Balance</SelectItem>
                    <SelectItem value="createdAt">Join Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sortOrder">Order</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Highest First</SelectItem>
                    <SelectItem value="asc">Lowest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payout Processing */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Process Payouts ({selectedUsers.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="payoutType">Payout Type</Label>
                <Select value={payoutType} onValueChange={setPayoutType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pay All Pending</SelectItem>
                    <SelectItem value="custom">Custom Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {payoutType === 'custom' && (
                <div>
                  <Label htmlFor="payoutAmount">Amount per User (PKR)</Label>
                  <Input
                    id="payoutAmount"
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                  />
                </div>
              )}
              
              <div className="flex items-end">
                <Button
                  onClick={handleProcessPayouts}
                  disabled={processing}
                  className="w-full"
                >
                  {processing ? 'Processing...' : `Process Payouts (${formatCurrency(getTotalSelectedPayout())})`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center space-x-2 pb-4 border-b">
              <Checkbox
                id="selectAll"
                checked={selectedUsers.length === users.length && users.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="selectAll" className="text-sm font-medium">
                Select All ({users.length} users)
              </Label>
            </div>

            {/* Users List */}
            {users.map((user) => (
              <div
                key={user.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedUsers.includes(user.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                    />
                    
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold">
                        {user.name || user.username || 'No Name'}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Code: {user.referralCode} | Joined: {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Total Earnings</div>
                        <div className="font-bold text-green-600">{formatCurrency(user.totalEarnings)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Pending</div>
                        <div className="font-bold text-yellow-600">{formatCurrency(user.pendingCommission)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Balance</div>
                        <div className="font-bold text-blue-600">{formatCurrency(user.balance)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Referrals:</span>
                      <span className="ml-2 font-medium">{user.referralCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Referral Earnings:</span>
                      <span className="ml-2 font-medium">{formatCurrency(user.totalReferralEarnings)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sponsor:</span>
                      <span className="ml-2 font-medium">
                        {user.sponsor ? (user.sponsor.name || user.sponsor.username || user.sponsor.email) : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
    </div>
  )
} 