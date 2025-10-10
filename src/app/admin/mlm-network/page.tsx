'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Network, 
  DollarSign, 
  TrendingUp, 
  UserPlus, 
  Search, 
  Filter,
  Eye,
  Share2,
  Crown,
  Star,
  Award
} from 'lucide-react'

interface UserNode {
  id: string
  name: string
  email: string
  level: number
  earnings: number
  referralCount: number
  children: UserNode[]
  sponsorId: string | null
  isActive: boolean
  avatar: string
  totalTeamSize: number
  totalTeamEarnings: number
}

interface NetworkStats {
  totalUsers: number
  activeUsers: number
  totalEarnings: number
  totalReferrals: number
  averageEarnings: number
  topPerformers: any[]
  levelDistribution: any[]
}

export default function MLMNetworkPage() {
  const [networkData, setNetworkData] = useState<UserNode[]>([])
  const [stats, setStats] = useState<NetworkStats | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserNode | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        const response = await fetch('/api/admin/mlm-network')
        if (response.ok) {
          const data = await response.json()
          setNetworkData(data.network)
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Error fetching network data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNetworkData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PK').format(num)
  }

  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-purple-500',
      2: 'bg-blue-500',
      3: 'bg-green-500',
      4: 'bg-yellow-500',
      5: 'bg-red-500'
    }
    return colors[level] || 'bg-gray-500'
  }

  const getLevelBadge = (level: number) => {
    const badges = {
      1: { label: 'Diamond', color: 'bg-purple-100 text-purple-800' },
      2: { label: 'Platinum', color: 'bg-blue-100 text-blue-800' },
      3: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800' },
      4: { label: 'Silver', color: 'bg-gray-100 text-gray-800' },
      5: { label: 'Bronze', color: 'bg-orange-100 text-orange-800' }
    }
    return badges[level] || { label: 'Member', color: 'bg-gray-100 text-gray-800' }
  }

  const renderUserNode = (user: UserNode, depth: number = 0) => {
    const levelBadge = getLevelBadge(user.level)
    
    return (
      <div key={user.id} className={`ml-${depth * 8} mb-4`}>
        <Card className={`${depth > 0 ? 'ml-8' : ''} ${!user.isActive ? 'opacity-60' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${getLevelColor(user.level)} flex items-center justify-center text-white font-bold`}>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={levelBadge.color}>{levelBadge.label}</Badge>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">{formatCurrency(user.earnings)}</div>
                <div className="text-sm text-gray-600">{formatNumber(user.referralCount)} referrals</div>
                <div className="text-sm text-gray-600">Team: {formatNumber(user.totalTeamSize)}</div>
              </div>
            </div>
            
            {user.children.length > 0 && (
              <div className="mt-4">
                <div className="border-l-2 border-gray-200 ml-5 pl-4">
                  {user.children.map(child => renderUserNode(child, depth + 1))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MLM Network</h1>
            <p className="text-gray-600">Visualize and manage your MLM network structure</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MLM Network</h1>
          <p className="text-gray-600">Visualize and manage your multi-level marketing network</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Export Network
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Network</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalUsers || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats?.activeUsers || 0)} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalEarnings || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Network-wide earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalReferrals || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Across all levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.averageEarnings || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Per active user
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Tree */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="w-5 h-5 mr-2" />
                Network Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
            {networkData.length === 0 ? (
              <div className="text-center py-8">
                <Network className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No network data available</p>
              </div>
            ) : (
              networkData.map(user => renderUserNode(user))
            )}
          </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Search User</Label>
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm">Level Filter</Label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    <SelectItem value="1">Level 1 (Direct)</SelectItem>
                    <SelectItem value="2">Level 2</SelectItem>
                    <SelectItem value="3">Level 3</SelectItem>
                    <SelectItem value="4">Level 4</SelectItem>
                    <SelectItem value="5">Level 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.open('/api/admin/mlm-network', '_blank')}
                  className="w-full"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{performer.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{formatCurrency(performer.earnings)}</div>
                      <div className="text-xs text-gray-600">{performer.referrals} refs</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Level Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.levelDistribution.map((level, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">Level {level.level}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{level.users} users</span>
                      <span className="text-sm text-gray-600">{formatCurrency(level.earnings)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
