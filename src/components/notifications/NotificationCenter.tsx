'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck,
  MoreVertical,
  DollarSign,
  CheckSquare,
  Users,
  ShoppingBag,
  AlertTriangle,
  Info,
  Calendar,
  FileText,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  category?: string
  priority: string
  isRead: boolean
  isDelivered: boolean
  actionUrl?: string
  actionText?: string
  imageUrl?: string
  data?: string
  createdAt: string
  readAt?: string
  clickedAt?: string
  createdBy?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface NotificationCenterProps {
  className?: string
  showButton?: boolean
  maxHeight?: string
}

export default function NotificationCenter({ 
  className = "", 
  showButton = true, 
  maxHeight = "600px" 
}: NotificationCenterProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Initialize real-time notifications
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!session?.user) return

    // Initial load
    fetchNotifications()

    // Set up Server-Sent Events for real-time updates
    const eventSource = new EventSource('/api/notifications/stream')
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'connected':
            console.log('Notification stream connected')
            break
            
          case 'notification':
            handleNewNotification(data.data)
            break
            
          case 'heartbeat':
            // Keep-alive ping
            break
            
          case 'error':
            console.error('Notification stream error:', data.message)
            break
        }
      } catch (error) {
        console.error('Error parsing notification data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          eventSourceRef.current = new EventSource('/api/notifications/stream')
        }
      }, 5000)
    }

    return () => {
      eventSource.close()
    }
  }, [session])

  const fetchNotifications = async (pageNum = 1, filterType = 'all') => {
    if (!session?.user) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      })
      if (filterType !== 'all') {
        if (filterType === 'unread') {
          params.set('unreadOnly', 'true')
        } else {
          params.set('type', filterType)
        }
      }

      const response = await fetch(`/api/notifications?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (pageNum === 1) {
          setNotifications(data.notifications)
        } else {
          setNotifications(prev => [...prev, ...data.notifications])
        }
        setUnreadCount(data.unreadCount)
        setHasMore(data.pagination.page < data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Play notification sound
    if (soundEnabled) {
      playNotificationSound()
    }

    // Show browser notification if permission granted (client-side only)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      })
    }
  }

  const playNotificationSound = () => {
    // Only create audio context in browser environment
    if (typeof window === 'undefined') {
      console.warn('Audio context not available in server environment');
      return;
    }
    
    if (!audioContextRef.current) {
      try {
        type AnyWindow = Window & { webkitAudioContext?: typeof AudioContext };
        const AW = window as AnyWindow;
        const Ctor = (AW as any).AudioContext || (AW as any).webkitAudioContext;
        if (!Ctor) {
          console.warn('Web Audio API not supported');
          return;
        }
        audioContextRef.current = new Ctor();
      } catch (error) {
        console.error('Failed to create audio context:', error);
        return;
      }
    }

    const audioContext = audioContextRef.current
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead' })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date().toISOString() 
        })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    console.log('🔔 Notification clicked:', notification)
    
    // Mark as read and clicked
    await markAsRead(notification.id)
    
    // Track click
    try {
      await fetch(`/api/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clicked' })
      })
    } catch (error) {
      console.error('Error tracking notification click:', error)
    }

    // Determine navigation URL based on notification type and data
    let navigationUrl = notification.actionUrl

    // Parse data for checking
    const data = typeof notification.data === 'string' 
      ? JSON.parse(notification.data || '{}') 
      : (notification.data || {})
    
    console.log('📊 Notification data:', data)

    // Check if it's a friend request notification (even if actionUrl exists)
    if (notification.message.includes('friend request') || data.kind === 'FRIEND_REQUEST' || data.kind?.includes('FRIEND_REQUEST')) {
      navigationUrl = `/social/friends`
    } else if (!navigationUrl) {
      // Fallback navigation logic for notifications without actionUrl
      switch (notification.type) {
        case 'event':
          if (data.postId) {
            navigationUrl = `/social?postId=${data.postId}`
          } else if (data.kind === 'FOLLOW') {
            navigationUrl = `/social/profile/${data.fromUserId}`
          }
          break
        case 'message':
          if (data.senderId) {
            navigationUrl = `/messages?userId=${data.senderId}`
          }
          break
        default:
          // Try to extract URLs from message content
          if (notification.message.includes('post')) {
            navigationUrl = '/social'
          } else if (notification.message.includes('message')) {
            navigationUrl = '/messages'
          }
      }
    }

    console.log('🔗 Navigating to:', navigationUrl)

    // Navigate to the determined URL (client-side only)
    if (navigationUrl && typeof window !== 'undefined') {
      window.location.href = navigationUrl
    } else if (!navigationUrl) {
      console.warn('⚠️ No navigation URL found for notification:', notification)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'money':
      case 'commission':
        return <DollarSign className="h-4 w-4 text-green-600" />
      case 'referral':
        return <Users className="h-4 w-4 text-blue-600" />
      case 'task':
        return <CheckSquare className="h-4 w-4 text-purple-600" />
      case 'order':
        return <ShoppingBag className="h-4 w-4 text-orange-600" />
      case 'blog':
        return <FileText className="h-4 w-4 text-indigo-600" />
      case 'event':
        return <Calendar className="h-4 w-4 text-pink-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <X className="h-4 w-4 text-red-600" />
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300'
      case 'high':
        return 'bg-orange-100 border-orange-300'
      case 'normal':
        return 'bg-blue-100 border-blue-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notif.isRead
    return notif.type === filter
  })

  if (!showButton) {
    // Return just the notifications list without the button
    return (
      <div className={className}>
        <NotificationsList 
          notifications={filteredNotifications}
          onNotificationClick={handleNotificationClick}
          onMarkAsRead={markAsRead}
          getNotificationIcon={getNotificationIcon}
          getPriorityColor={getPriorityColor}
          maxHeight={maxHeight}
        />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 z-50 shadow-xl border">
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount}</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMoreOpen((v) => !v)}
                  aria-label="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Filters and See all */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                {['all', 'unread'].map((filterType) => (
                  <Button
                    key={filterType}
                    variant={filter === filterType ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setFilter(filterType)
                      if (filterType !== filter) {
                        setPage(1)
                        fetchNotifications(1, filterType)
                      }
                    }}
                    className="text-xs"
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </Button>
                ))}
              </div>
              <Link href="/social/notifications" className="text-xs text-blue-600 hover:underline">
                See all
              </Link>
            </div>

            {moreOpen && (
              <div className="absolute right-2 top-12 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <button
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  onClick={() => { setMoreOpen(false); markAllAsRead(); }}
                >
                  Mark all as read
                </button>
                <Link href="/settings/notifications" className="block px-3 py-2 hover:bg-gray-50 text-sm">
                  Notification settings
                </Link>
                <Link href="/social/notifications" className="block px-3 py-2 hover:bg-gray-50 text-sm">
                  Open Notifications
                </Link>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <NotificationsList 
              notifications={filteredNotifications}
              onNotificationClick={handleNotificationClick}
              onMarkAsRead={markAsRead}
              getNotificationIcon={getNotificationIcon}
              getPriorityColor={getPriorityColor}
              maxHeight="400px"
              grouped={filter === 'all'}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={() => {
                if (!loading && hasMore) {
                  const nextPage = page + 1
                  setPage(nextPage)
                  fetchNotifications(nextPage, filter)
                }
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Separate component for the notifications list
interface NotificationsListProps {
  notifications: Notification[]
  onNotificationClick: (notification: Notification) => void
  onMarkAsRead: (id: string) => void
  getNotificationIcon: (type: string) => React.ReactNode
  getPriorityColor: (priority: string) => string
  maxHeight: string
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  grouped?: boolean
}

function NotificationsList({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  getNotificationIcon,
  getPriorityColor,
  maxHeight,
  loading,
  hasMore,
  onLoadMore,
  grouped = false
}: NotificationsListProps) {
  const now = new Date();
  const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h for "New"
  const newItems = grouped ? notifications.filter(n => new Date(n.createdAt) > threshold) : notifications;
  const earlierItems = grouped ? notifications.filter(n => new Date(n.createdAt) <= threshold) : [];
  return (
    <ScrollArea style={{ maxHeight }} className="w-full">
      {notifications.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {grouped ? (
            <>
              {newItems.length > 0 && (
                <>
                  <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500">New</div>
                  {newItems.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''} ${getPriorityColor(notification.priority)}`}
                      onClick={() => onNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">{notification.title}</h4>
                            <div className="flex items-center gap-2">
                              {notification.priority === 'urgent' && (<Zap className="h-3 w-3 text-red-500" />)}
                              <span className="text-xs text-gray-500 whitespace-nowrap">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                              {!notification.isRead && (<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                          {notification.actionText && (
                            <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs" onClick={(e) => { e.stopPropagation(); onNotificationClick(notification) }}>
                              {notification.actionText}
                            </Button>
                          )}
                        </div>
                        {!notification.isRead && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id) }} className="h-6 w-6 p-0">
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {earlierItems.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500">Earlier</div>
                  {earlierItems.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''} ${getPriorityColor(notification.priority)}`}
                      onClick={() => onNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">{notification.title}</h4>
                            <div className="flex items-center gap-2">
                              {notification.priority === 'urgent' && (<Zap className="h-3 w-3 text-red-500" />)}
                              <span className="text-xs text-gray-500 whitespace-nowrap">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                              {!notification.isRead && (<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                          {notification.actionText && (
                            <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs" onClick={(e) => { e.stopPropagation(); onNotificationClick(notification) }}>
                              {notification.actionText}
                            </Button>
                          )}
                        </div>
                        {!notification.isRead && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id) }} className="h-6 w-6 p-0">
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''} ${getPriorityColor(notification.priority)}`}
                  onClick={() => onNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{notification.title}</h4>
                        <div className="flex items-center gap-2">
                          {notification.priority === 'urgent' && (<Zap className="h-3 w-3 text-red-500" />)}
                          <span className="text-xs text-gray-500 whitespace-nowrap">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                          {!notification.isRead && (<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                      {notification.actionText && (
                        <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs" onClick={(e) => { e.stopPropagation(); onNotificationClick(notification) }}>
                          {notification.actionText}
                        </Button>
                      )}
                    </div>
                    {!notification.isRead && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id) }} className="h-6 w-6 p-0">
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          
          {hasMore && (
            <div className="p-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMore}
                disabled={loading}
                className="text-xs"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}
    </ScrollArea>
  )
} 