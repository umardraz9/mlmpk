'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Network, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Settings, 
  Eye,
  Award,
  Activity,
  Target,
  Layers,
  UserCheck,
  PieChart,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Crown,
  Star
} from 'lucide-react'

interface NetworkNode {
  id: string
  name: string | null
  email: string | null
  username: string | null
  avatar: string | null
  isActive: boolean
  role: string
  referralCode: string
  balance: number
  totalEarnings: number
  pendingCommission: number
  referralCount: number
  teamEarnings: number
  children: NetworkNode[]
  level: number
  _count: {
    orders: number
    blogPosts: number
    blogComments: number
  }
}

interface NetworkAnalytics {
  totalUsers: number
  activeUsers: number
  networkDepth: number
  totalEarnings: number
  pendingCommissions: number
  totalBalance: number
  topEarners: any[]
  recentJoins: any[]
}

interface CommissionRates {
  directReferral: number
  level2: number
  level3: number
  level4: number
  level5: number
  maxLevels: number
  minimumPayout: number
  payoutSchedule: string
  taskCommissionRate: number
  productCommissionRate: number
  bonusThresholds: {
    bronze: { referrals: number; bonus: number }
    silver: { referrals: number; bonus: number }
    gold: { referrals: number; bonus: number }
    platinum: { referrals: number; bonus: number }
  }
}

export default function MLMPage() {
  const [networkData, setNetworkData] = useState<NetworkNode[]>([])
  const [analytics, setAnalytics] = useState<NetworkAnalytics | null>(null)
  const [commissionRates, setCommissionRates] = useState<CommissionRates | null>(null)
  const [commissionStats, setCommissionStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [viewDepth, setViewDepth] = useState(3)
  const [includeInactive, setIncludeInactive] = useState(false)

  useEffect(() => {
    fetchNetworkData()
    fetchCommissionRates()
  }, [selectedUserId, viewDepth, includeInactive])

  const fetchNetworkData = async () => {
    try {
      const params = new URLSearchParams({
        depth: viewDepth.toString(),
        includeInactive: includeInactive.toString(),
        ...(selectedUserId && { userId: selectedUserId })
      })

      const response = await fetch(`/api/admin/mlm/network?${params}`)
      const data = await response.json()

      if (response.ok) {
        setNetworkData(Array.isArray(data.networkData) ? data.networkData : [data.networkData])
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching network data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommissionRates = async () => {
    try {
      const response = await fetch('/api/admin/mlm/commission-rates')
      const data = await response.json()

      if (response.ok) {
        setCommissionRates(data.rates)
        setCommissionStats(data.statistics)
      }
    } catch (error) {
      console.error('Error fetching commission rates:', error)
    }
  }

  const updateCommissionRates = async () => {
    if (!commissionRates) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/mlm/commission-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commissionRates)
      })

      const data = await response.json()
      if (response.ok) {
        setCommissionRates(data.rates)
        alert('Commission rates updated successfully')
      } else {
        alert(data.error || 'Failed to update commission rates')
      }
    } catch (error) {
      console.error('Error updating commission rates:', error)
      alert('Failed to update commission rates')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email?.charAt(0).toUpperCase() || 'U'
  }

  const getUserLevel = (referralCount: number) => {
    if (referralCount >= 50) return { level: 'Platinum', color: 'bg-purple-100 text-purple-800', icon: Crown }
    if (referralCount >= 25) return { level: 'Gold', color: 'bg-yellow-100 text-yellow-800', icon: Star }
    if (referralCount >= 10) return { level: 'Silver', color: 'bg-gray-100 text-gray-800', icon: Award }
    if (referralCount >= 5) return { level: 'Bronze', color: 'bg-orange-100 text-orange-800', icon: Target }
    return { level: 'Starter', color: 'bg-green-100 text-green-800', icon: UserCheck }
  }

  const renderNetworkNode = (node: NetworkNode, depth: number = 0) => {
    const userLevel = getUserLevel(node.referralCount)
    const LevelIcon = userLevel.icon

    return (
      <div key={node.id} className="mb-4">
        <div className={`border rounded-lg p-4 ${depth > 0 ? 'ml-8 border-l-4 border-blue-200' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={node.avatar || undefined} />
                <AvatarFallback>{getInitials(node.name, node.email)}</AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">
                    {node.name || node.username || 'No Name'}
                  </h3>
                  <Badge className={userLevel.color}>
                    <LevelIcon className="w-3 h-3 mr-1" />
                    {userLevel.level}
                  </Badge>
                  <Badge variant={node.isActive ? 'default' : 'secondary'}>
                    {node.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{node.email}</p>
                <p className="text-xs text-gray-500">Level {node.level} • {node.referralCode}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium">{formatCurrency(node.totalEarnings)}</div>
              <div className="text-xs text-gray-500">{node.referralCount} referrals</div>
              <div className="text-xs text-blue-600">Team: {formatCurrency(node.teamEarnings)}</div>
            </div>
          </div>
        </div>
        
        {node.children.map(child => renderNetworkNode(child, depth + 1))}
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900">MLM Management</h1>
          <p className="text-gray-600">Manage network structure, commission rates, and MLM analytics</p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Size</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Depth</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.networkDepth}</div>
              <p className="text-xs text-muted-foreground">
                levels deep
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(analytics.pendingCommissions)} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalBalance)}</div>
              <p className="text-xs text-green-600">
                Total user balances
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="network" className="space-y-4">
        <TabsList>
          <TabsTrigger value="network">Network View</TabsTrigger>
          <TabsTrigger value="commission">Commission Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Network View */}
        <TabsContent value="network" className="space-y-4">
          {/* Network Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Network Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="selectedUser">Focus on User (optional)</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user to focus on" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Users</SelectItem>
                      {analytics?.topEarners.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email} ({formatCurrency(user.totalEarnings)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="viewDepth">View Depth</Label>
                  <Select value={viewDepth.toString()} onValueChange={(value) => setViewDepth(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Level</SelectItem>
                      <SelectItem value="2">2 Levels</SelectItem>
                      <SelectItem value="3">3 Levels</SelectItem>
                      <SelectItem value="4">4 Levels</SelectItem>
                      <SelectItem value="5">5 Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeInactive"
                    checked={includeInactive}
                    onChange={(e) => setIncludeInactive(e.target.checked)}
                  />
                  <Label htmlFor="includeInactive">Include Inactive</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Tree */}
          <Card>
            <CardHeader>
              <CardTitle>Network Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {networkData.length > 0 ? (
                  networkData.map(node => renderNetworkNode(node))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No network data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Rules */}
        <TabsContent value="commission" className="space-y-4">
          {commissionRates && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Level Commission Rates */}
              <Card>
                <CardHeader>
                  <CardTitle>Level Commission Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="directReferral">Direct Referral (%)</Label>
                    <Input
                      id="directReferral"
                      type="number"
                      value={commissionRates.directReferral}
                      onChange={(e) => setCommissionRates({
                        ...commissionRates,
                        directReferral: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="level2">Level 2 (%)</Label>
                    <Input
                      id="level2"
                      type="number"
                      value={commissionRates.level2}
                      onChange={(e) => setCommissionRates({
                        ...commissionRates,
                        level2: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="level3">Level 3 (%)</Label>
                    <Input
                      id="level3"
                      type="number"
                      value={commissionRates.level3}
                      onChange={(e) => setCommissionRates({
                        ...commissionRates,
                        level3: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="level4">Level 4 (%)</Label>
                    <Input
                      id="level4"
                      type="number"
                      value={commissionRates.level4}
                      onChange={(e) => setCommissionRates({
                        ...commissionRates,
                        level4: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="level5">Level 5 (%)</Label>
                    <Input
                      id="level5"
                      type="number"
                      value={commissionRates.level5}
                      onChange={(e) => setCommissionRates({
                        ...commissionRates,
                        level5: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="maxLevels">Maximum Levels</Label>
                    <Input
                      id="maxLevels"
                      type="number"
                      value={commissionRates.maxLevels}
                      onChange={(e) => setCommissionRates({
                        ...commissionRates,
                        maxLevels: parseInt(e.target.value) || 5
                      })}
                      min="1"
                      max="10"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="minimumPayout">Minimum Payout (PKR)</Label>
                    <Input
                      id="minimumPayout"
                      type="number"
                      value={commissionRates.minimumPayout}
                      onChange={(e) => setCommissionRates({
                        ...commissionRates,
                        minimumPayout: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                    <Select 
                      value={commissionRates.payoutSchedule} 
                      onValueChange={(value) => setCommissionRates({
                        ...commissionRates,
                        payoutSchedule: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="taskCommissionRate">Task Commission Rate (%)</Label>
                    <Input
                      id="taskCommissionRate"
                      type="number"
                      value={commissionRates.taskCommissionRate}
                      onChange={(e) => setCommissionRates({
                        ...commissionRates,
                        taskCommissionRate: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="productCommissionRate">Product Commission Rate (%)</Label>
                    <Input
                      id="productCommissionRate"
                      type="number"
                      value={commissionRates.productCommissionRate}
                      onChange={(e) => setCommissionRates({
                        ...commissionRates,
                        productCommissionRate: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                      max="100"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={updateCommissionRates}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Commission Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Earners */}
            <Card>
              <CardHeader>
                <CardTitle>Top Earners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topEarners.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || user.email}</div>
                          <div className="text-sm text-gray-500">{user.referralCode}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(user.totalEarnings)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Joins */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Network Joins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.recentJoins.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || user.email}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">New</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Statistics */}
          {commissionStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Commissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(commissionStats.totalCommissions)}</div>
                  <p className="text-sm text-gray-600">All time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pending Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(commissionStats.pendingPayouts)}</div>
                  <p className="text-sm text-gray-600">Ready for payout</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Commissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(commissionStats.monthlyCommissions)}</div>
                  <p className="text-sm text-gray-600">This month</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 