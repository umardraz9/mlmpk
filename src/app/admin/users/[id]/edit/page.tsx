'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Save, User, Shield, DollarSign, Phone, Mail, Lock, Calendar, TrendingUp, ShoppingCart, FileText, MessageSquare } from 'lucide-react'

interface UserData {
  id: string
  name: string | null
  email: string | null
  username: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  avatar: string | null
  role: string
  isActive: boolean
  isAdmin: boolean
  membershipPlan?: string | null
  membershipStatus?: string | null
  tasksEnabled?: boolean
  membershipStartDate?: string | null
  membershipEndDate?: string | null
  sponsorId: string | null
  balance: number
  totalEarnings: number
  pendingCommission: number
  referralCode: string
  referredBy: string | null
  createdAt: string
  updatedAt: string
  orders: any[]
  blogPosts: any[]
  blogComments: any[]
  _count: {
    orders: number
    blogPosts: number
    blogComments: number
  }
  referralStats: number
  sponsor: {
    id: string
    name: string | null
    email: string | null
    username: string | null
    referralCode: string
  } | null
}

interface SponsorUser {
  id: string
  name: string | null
  email: string | null
  username: string | null
  referralCode: string
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [sponsors, setSponsors] = useState<SponsorUser[]>([])
  const [plans, setPlans] = useState<Array<{ id: string; name: string; displayName: string; tasksPerDay?: number }>>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    isActive: true,
    isAdmin: false,
    membershipPlan: '',
    membershipStatus: 'INACTIVE',
    tasksEnabled: true,
    sponsorId: '',
    balance: 0,
    totalEarnings: 0,
    pendingCommission: 0,
    avatar: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchUserData()
      fetchSponsors()
      fetchPlans()
    }
  }, [params.id])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setUserData(data)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          username: data.username || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          password: '',
          confirmPassword: '',
          role: data.role,
          isActive: data.isActive,
          isAdmin: data.isAdmin,
          membershipPlan: data.membershipPlan || '',
          membershipStatus: data.membershipStatus || 'INACTIVE',
          tasksEnabled: typeof data.tasksEnabled === 'boolean' ? data.tasksEnabled : true,
          sponsorId: data.sponsorId || '',
          balance: data.balance,
          totalEarnings: data.totalEarnings,
          pendingCommission: data.pendingCommission,
          avatar: data.avatar || ''
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSponsors = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100&status=active')
      const data = await response.json()
      if (response.ok) {
        setSponsors(data.users.filter((user: any) => user.id !== params.id))
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/membership-plans?includeAll=1')
      const data = await res.json()
      if (data?.success && Array.isArray(data.plans)) {
        setPlans(data.plans.map((p: any) => ({ id: p.id, name: p.name, displayName: p.displayName, tasksPerDay: p.tasksPerDay })))
      }
    } catch (e) {
      console.error('Error fetching plans', e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (formData.password && formData.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    setSaving(true)

    try {
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }
      delete updateData.confirmPassword

      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/admin/users')
      } else {
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email?.charAt(0).toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">User not found</h2>
        <p className="text-gray-600 mt-2">The user you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/admin/users')} className="mt-4">
          Back to Users
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600">Update user information and settings</p>
        </div>
      </div>

      {/* User Overview */}
      <Card>
        <CardHeader>
          <CardTitle>User Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userData.avatar || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(userData.name, userData.email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-xl font-semibold">
                  {userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'No Name'}
                </h2>
                <Badge variant={userData.isActive ? 'default' : 'secondary'}>
                  {userData.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">
                  {userData.role}
                </Badge>
                {userData.isAdmin && (
                  <Badge variant="outline" className="border-orange-500 text-orange-600">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>
                  <div className="font-medium">{userData.email}</div>
                </div>
                <div>
                  <span className="text-gray-600">Referral Code:</span>
                  <div className="font-medium">{userData.referralCode}</div>
                </div>
                <div>
                  <span className="text-gray-600">Joined:</span>
                  <div className="font-medium">{formatDate(userData.createdAt)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <div className="font-medium">{formatDate(userData.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-600">Balance</span>
              </div>
              <div className="text-xl font-semibold">{formatCurrency(userData.balance)}</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600">Total Earnings</span>
              </div>
              <div className="text-xl font-semibold">{formatCurrency(userData.totalEarnings)}</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-purple-600">Orders</span>
              </div>
              <div className="text-xl font-semibold">{userData._count.orders}</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-orange-600">Referrals</span>
              </div>
              <div className="text-xl font-semibold">{userData.referralStats}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Change Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Role & Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MODERATOR">Moderator</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sponsorId">Sponsor</Label>
                <Select value={formData.sponsorId} onValueChange={(value) => handleChange('sponsorId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sponsor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Sponsor</SelectItem>
                    {sponsors.map((sponsor) => (
                      <SelectItem key={sponsor.id} value={sponsor.id}>
                        {sponsor.name || sponsor.username || sponsor.email} ({sponsor.referralCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active Account</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onCheckedChange={(checked) => handleChange('isAdmin', checked)}
                />
                <Label htmlFor="isAdmin">Admin Access</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Membership & Task Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Membership & Task Access</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Membership Plan</Label>
                <Select value={formData.membershipPlan} onValueChange={(v) => handleChange('membershipPlan', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Plan</SelectItem>
                    {plans.map(p => (
                      <SelectItem key={p.id} value={p.name}>{p.displayName} ({p.name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.membershipStatus} onValueChange={(v) => handleChange('membershipStatus', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tasksEnabled"
                    checked={formData.tasksEnabled}
                    onCheckedChange={(checked) => handleChange('tasksEnabled', checked)}
                  />
                  <Label htmlFor="tasksEnabled">Tasks Enabled</Label>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">Tip: Set a plan and mark status ACTIVE to enable non-zero per-task rewards on the user dashboard.</p>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Financial Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="balance">Account Balance (PKR)</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => handleChange('balance', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="totalEarnings">Total Earnings (PKR)</Label>
                <Input
                  id="totalEarnings"
                  type="number"
                  step="0.01"
                  value={formData.totalEarnings}
                  onChange={(e) => handleChange('totalEarnings', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="pendingCommission">Pending Commission (PKR)</Label>
                <Input
                  id="pendingCommission"
                  type="number"
                  step="0.01"
                  value={formData.pendingCommission}
                  onChange={(e) => handleChange('pendingCommission', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 