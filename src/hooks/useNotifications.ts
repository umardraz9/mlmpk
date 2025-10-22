'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '@/hooks/useSession';

export enum NotificationEventType {
  MESSAGE_RECEIVED = 'message_received',
  COMMISSION_EARNED = 'commission_earned',
  TASK_COMPLETED = 'task_completed',
  PAYMENT_PROCESSED = 'payment_processed',
  USER_JOINED = 'user_joined',
  SYSTEM_UPDATE = 'system_update'
}

export interface NotificationEvent {
  id: string;
  type: NotificationEventType;
  userId: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

interface UseNotificationsOptions {
  onNotification?: (event: NotificationEvent) => void;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const {
    onNotification,
    autoConnect = true,
    reconnectAttempts = 3,
    reconnectInterval = 5000
  } = options;

  // @ts-ignore
  const userId = session?.user?.id;

  const connect = useCallback(() => {
    if (!userId) return;

    try {
      const eventSource = new EventSource('/api/notifications/sse');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection established');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const notificationEvent: NotificationEvent = JSON.parse(event.data);

          // Add to notifications array
          setNotifications(prev => [notificationEvent, ...prev.slice(0, 49)]); // Keep last 50

          // Call custom handler
          if (onNotification) {
            onNotification(notificationEvent);
          }

          // Show browser notification if permission granted
          if (notificationEvent.priority === 'high' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification(notificationEvent.title, {
                body: notificationEvent.message,
                icon: '/icons/icon-192x192.png',
                tag: notificationEvent.id
              });
            }
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        setConnectionError('Connection lost');

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${reconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            disconnect();
            connect();
          }, reconnectInterval);
        }
      };

    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
      setConnectionError('Failed to connect');
    }
  }, [userId, onNotification, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendNotification = useCallback(async (
    type: NotificationEventType,
    title: string,
    message: string,
    options: {
      userId?: string;
      data?: any;
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ) => {
    try {
      const response = await fetch('/api/notifications/sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          title,
          message,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, data: { ...notification.data, read: true } }
          : notification
      )
    );
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }, []);

  // Auto-connect when session is available
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    notifications,
    connect,
    disconnect,
    sendNotification,
    clearNotifications,
    markAsRead,
    requestPermission
  };
}

// Hook for managing notification permissions
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window
  };
}
