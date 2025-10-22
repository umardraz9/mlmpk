'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Send, 
  Users, 
  Calendar,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  priority: string
  recipientId?: string
  role?: string
  audience?: string
  isGlobal: boolean
  isActive: boolean
  isDelivered: boolean
  scheduledFor?: string
  expiresAt?: string
  createdAt: string
  createdBy?: {
    name: string
    email: string
  }
}

export default function AdminNotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    recipientId: '',
    role: '',
    audience: 'all',
    isGlobal: true,
    scheduledFor: '',
    expiresAt: '',
    actionUrl: '',
    actionText: ''
  })

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchNotifications()
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/notifications')
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledFor: formData.scheduledFor || null,
          expiresAt: formData.expiresAt || null,
          recipientId: formData.recipientId || null,
          role: formData.role || null
        })
      })

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          title: '',
          message: '',
          type: 'info',
          priority: 'normal',
          recipientId: '',
          role: '',
          audience: 'all',
          isGlobal: true,
          scheduledFor: '',
          expiresAt: '',
          actionUrl: '',
          actionText: ''
        })
        fetchNotifications()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create notification')
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      alert('Failed to create notification')
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotifications = async () => {
    const testNotifications = [
      {
        title: 'System Maintenance Notice',
        message: 'Scheduled maintenance will occur tonight from 11 PM to 1 AM. Some features may be temporarily unavailable.',
        type: 'warning',
        priority: 'high',
        isGlobal: true,
        audience: 'all'
      },
      {
        title: 'New Feature Available!',
        message: 'Check out our new real-time notification system. Stay updated with instant alerts!',
        type: 'success',
        priority: 'normal',
        isGlobal: true,
        audience: 'all',
        actionUrl: '/dashboard',
        actionText: 'Explore Now'
      },
      {
        title: 'Welcome to MLM-Pak!',
        message: 'Your comprehensive MLM platform is ready. Start building your network and earning commissions today!',
        type: 'info',
        priority: 'normal',
        isGlobal: true,
        audience: 'new_users'
      }
    ]

    try {
      setLoading(true)
      for (const notification of testNotifications) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification)
        })
      }
      fetchNotifications()
      alert('Test notifications sent successfully!')
    } catch (error) {
      console.error('Error sending test notifications:', error)
      alert('Failed to send test notifications')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (notification: Notification) => {
    if (!notification.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    
    const now = new Date()
    const scheduledFor = notification.scheduledFor ? new Date(notification.scheduledFor) : null
    const expiresAt = notification.expiresAt ? new Date(notification.expiresAt) : null
    
    if (expiresAt && expiresAt < now) {
      return <Badge variant="destructive">Expired</Badge>
    }
    
    if (scheduledFor && scheduledFor > now) {
      return <Badge variant="outline">Scheduled</Badge>
    }
    
    if (notification.isDelivered) {
      return <Badge variant="default">Delivered</Badge>
    }
    
    return <Badge variant="secondary">Pending</Badge>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-blue-600" />
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true
    if (filter === 'active') return notif.isActive
    if (filter === 'delivered') return notif.isDelivered
    if (filter === 'scheduled') {
      const scheduledFor = notif.scheduledFor ? new Date(notif.scheduledFor) : null
      return scheduledFor && scheduledFor > new Date()
    }
    return notif.type === filter
  })

  if (!session?.user?.isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p>Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-blue-600" />
            Notification Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage system-wide notifications and alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={sendTestNotifications}
            variant="outline"
            disabled={loading}
          >
            <Send className="h-4 w-4 mr-1" />
            Send Test Notifications
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Notification
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter(n => n.isDelivered).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {notifications.filter(n => {
                const scheduledFor = n.scheduledFor ? new Date(n.scheduledFor) : null
                return scheduledFor && scheduledFor > new Date()
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {notifications.filter(n => n.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Notification Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="money">Money</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="audience">Audience</Label>
                  <Select value={formData.audience} onValueChange={(value) => setFormData({ ...formData, audience: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active_users">Active Users</SelectItem>
                      <SelectItem value="new_users">New Users</SelectItem>
                      <SelectItem value="admins">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Target Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Users</SelectItem>
                      <SelectItem value="ADMIN">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="actionUrl">Action URL</Label>
                  <Input
                    id="actionUrl"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    placeholder="/dashboard"
                  />
                </div>
                <div>
                  <Label htmlFor="actionText">Action Text</Label>
                  <Input
                    id="actionText"
                    value={formData.actionText}
                    onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
                    placeholder="View Details"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledFor">Schedule For</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Notification'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            {['all', 'active', 'delivered', 'scheduled', 'info', 'success', 'warning', 'error'].map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="text-xs"
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              disabled={loading}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          {getStatusBadge(notification)}
                          <Badge variant="outline">{notification.priority}</Badge>
                          <Badge variant="secondary">{notification.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.scheduledFor && (
                            <span>Scheduled: {new Date(notification.scheduledFor).toLocaleString()}</span>
                          )}
                          {notification.expiresAt && (
                            <span>Expires: {new Date(notification.expiresAt).toLocaleString()}</span>
                          )}
                          <span>Audience: {notification.audience || 'All'}</span>
                          {notification.isGlobal && <span>Global</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 