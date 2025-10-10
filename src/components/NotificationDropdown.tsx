'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  BellRing,
  Settings,
  Trash2,
  Check,
  CheckCheck,
  ExternalLink,
  X
} from 'lucide-react';
import { useNotifications, useNotificationPermission, NotificationEvent, NotificationEventType } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { permission, requestPermission, isSupported } = useNotificationPermission();
  const {
    isConnected,
    notifications,
    clearNotifications,
    markAsRead
  } = useNotifications({
    onNotification: (event) => {
      // Handle real-time notifications
      console.log('Real-time notification received:', event);
    }
  });

  const unreadCount = notifications.filter(n => !n.data?.read).length;

  const handleNotificationClick = (notification: NotificationEvent) => {
    markAsRead(notification.id);

    // Handle action URL if present
    if (notification.data?.actionUrl) {
      window.open(notification.data.actionUrl, '_blank');
    }
  };

  const handleMarkAllRead = () => {
    notifications.forEach(notification => {
      if (!notification.data?.read) {
        markAsRead(notification.id);
      }
    });
  };

  const getNotificationIcon = (type: NotificationEventType) => {
    switch (type) {
      case NotificationEventType.MESSAGE_RECEIVED:
        return '💬';
      case NotificationEventType.COMMISSION_EARNED:
        return '💰';
      case NotificationEventType.TASK_COMPLETED:
        return '✅';
      case NotificationEventType.PAYMENT_PROCESSED:
        return '💳';
      case NotificationEventType.USER_JOINED:
        return '👥';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Notification Settings</h4>

          {isSupported && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Browser Notifications</span>
                <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
                  {permission === 'granted' ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              {permission !== 'granted' && (
                <Button
                  size="sm"
                  onClick={requestPermission}
                  className="w-full"
                >
                  Enable Browser Notifications
                </Button>
              )}
            </div>
          )}

          <div className="flex space-x-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="flex-1"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearNotifications}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="max-h-96">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Bell className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-center">No notifications yet</p>
            <p className="text-sm text-center mt-1">We'll notify you when there's something new!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.data?.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </span>

                          {notification.data?.actionUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(notification.data.actionUrl, '_blank');
                              }}
                              className="text-xs"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>

                      {!notification.data?.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/notifications'}
            className="w-full text-blue-600 hover:text-blue-700"
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );
}

// Notification Toast Component for individual notifications
interface NotificationToastProps {
  notification: NotificationEvent;
  onDismiss: (id: string) => void;
  onAction?: (notification: NotificationEvent) => void;
}

export function NotificationToast({ notification, onDismiss, onAction }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction(notification);
    }
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transform transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    }`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
              {getNotificationIcon(notification.type)}
            </div>
          </div>

          <div className="ml-3 w-0 flex-1 pt-0.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <button
                onClick={handleDismiss}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-1 text-sm text-gray-600">
              {notification.message}
            </p>

            {notification.data?.actionText && (
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={handleAction}
                  className="text-xs"
                >
                  {notification.data.actionText}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getNotificationIcon(type: NotificationEventType): string {
  switch (type) {
    case NotificationEventType.MESSAGE_RECEIVED:
      return '💬';
    case NotificationEventType.COMMISSION_EARNED:
      return '💰';
    case NotificationEventType.TASK_COMPLETED:
      return '✅';
    case NotificationEventType.PAYMENT_PROCESSED:
      return '💳';
    case NotificationEventType.USER_JOINED:
      return '👥';
    default:
      return '🔔';
  }
}
