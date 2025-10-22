'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bell,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Trophy,
  X,
  CheckCircle,
  Clock
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'share' | 'friend_request' | 'achievement' | 'mention';
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: Date;
  isRead: boolean;
  postId?: string;
  postContent?: string;
}

interface RealTimeNotificationsProps {
  onNotificationClick?: (notification: NotificationItem) => void;
}

export default function RealTimeNotifications({ onNotificationClick }: RealTimeNotificationsProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock real-time notifications data
  const mockNotifications: NotificationItem[] = [
    {
      id: '1',
      type: 'like',
      user: {
        id: '1',
        name: 'Sarah Johnson',
        avatar: '/api/placeholder/32/32'
      },
      content: 'liked your post about network marketing success',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      isRead: false,
      postId: 'post1',
      postContent: 'Just closed my biggest deal yet! 💰'
    },
    {
      id: '2',
      type: 'comment',
      user: {
        id: '2',
        name: 'Mike Chen',
        avatar: '/api/placeholder/32/32'
      },
      content: 'commented on your achievement post',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      isRead: false,
      postId: 'post2',
      postContent: 'Congratulations on reaching Level 5! 🏆'
    },
    {
      id: '3',
      type: 'friend_request',
      user: {
        id: '3',
        name: 'Emma Davis',
        avatar: '/api/placeholder/32/32'
      },
      content: 'sent you a friend request',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false
    },
    {
      id: '4',
      type: 'achievement',
      user: {
        id: '4',
        name: 'System',
        avatar: '/api/placeholder/32/32'
      },
      content: 'You earned the "Team Builder" badge!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      isRead: true
    },
    {
      id: '5',
      type: 'mention',
      user: {
        id: '5',
        name: 'John Smith',
        avatar: '/api/placeholder/32/32'
      },
      content: 'mentioned you in a comment',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      isRead: true,
      postId: 'post3',
      postContent: '@' + (session?.user?.name || 'You') + ' Great insights on MLM strategies!'
    }
  ];

  useEffect(() => {
    // Initialize with mock data
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length);

    // Simulate real-time updates (in a real app, this would use WebSocket/SSE)
    const interval = setInterval(() => {
      // Randomly add new notifications
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const newNotification: NotificationItem = {
          id: Date.now().toString(),
          type: 'like',
          user: {
            id: Math.random().toString(),
            name: `User ${Math.floor(Math.random() * 100)}`,
            avatar: '/api/placeholder/32/32'
          },
          content: 'liked your recent post',
          timestamp: new Date(),
          isRead: false
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'share':
        return <Share2 className="h-4 w-4 text-green-500" />;
      case 'friend_request':
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'mention':
        return <span className="text-blue-500 font-bold">@</span>;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);
    onNotificationClick?.(notification);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={notification.user.avatar} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {notification.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{notification.user.name}</span>
                              {' '}
                              <span className="text-gray-600">{notification.content}</span>
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>

                        {notification.postContent && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            "{notification.postContent}"
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-6 w-6 p-0 hover:bg-gray-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Remove notification
                          setNotifications(prev => prev.filter(n => n.id !== notification.id));
                          setUnreadCount(prev => notification.isRead ? prev : prev - 1);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full text-blue-600 hover:text-blue-700"
              onClick={() => setShowDropdown(false)}
            >
              See All Notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
