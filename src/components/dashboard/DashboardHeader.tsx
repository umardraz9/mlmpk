'use client';

import React, { memo, useState, useEffect } from 'react';
import { Bell, Eye, EyeOff, ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/contexts/ThemeContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'money' | 'event' | 'warning' | 'info';
  read?: boolean;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  isDark: boolean;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = memo(({
  notifications,
  onClose,
  onMarkAsRead,
  isDark
}) => (
  <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50 transition-colors ${
    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  }`}>
    <div className={`p-4 border-b transition-colors ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Notifications</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className={`p-1 transition-colors ${
            isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-label="Close notifications"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
    <div className="max-h-96 overflow-y-auto">
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b last:border-b-0 cursor-pointer transition-colors ${
              isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
            } ${!notification.read ? (isDark ? 'bg-gray-750' : 'bg-blue-50') : ''}`}
            onClick={() => onMarkAsRead(notification.id)}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'money' ? 'bg-yellow-500' :
                notification.type === 'warning' ? 'bg-red-500' :
                notification.type === 'event' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}></div>
              <div className="flex-1">
                <p className={`font-medium text-sm transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{notification.title}</p>
                <p className={`text-xs mt-1 transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>{notification.message}</p>
                <p className={`text-xs mt-1 transition-colors ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>{notification.time}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="p-4 text-center">
          <p className={`text-sm transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>No notifications</p>
        </div>
      )}
    </div>
  </div>
));

NotificationDropdown.displayName = 'NotificationDropdown';

interface MessageDropdownProps {
  messageCount: number;
  onClose: () => void;
  isDark: boolean;
}

export const MessageDropdown: React.FC<MessageDropdownProps> = memo(({
  messageCount,
  onClose,
  isDark
}) => (
  <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50 transition-colors ${
    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  }`}>
    <div className={`p-4 border-b transition-colors ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Messages</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className={`p-1 transition-colors ${
            isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-label="Close messages"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
    <div className="max-h-96 overflow-y-auto">
      <div className={`p-4 border-b cursor-pointer transition-colors ${
        isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
      }`}>
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-600 text-white text-xs">A</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className={`font-medium text-sm transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Admin Support</p>
            <p className={`text-xs mt-1 transition-colors ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>Welcome to MCNmart! How can we help you today?</p>
            <p className={`text-xs mt-1 transition-colors ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}>2 hours ago</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
        </div>
      </div>
      <div className="p-4 text-center">
        <Button variant="outline" size="sm" className="w-full">
          View All Messages
        </Button>
      </div>
    </div>
  </div>
));

MessageDropdown.displayName = 'MessageDropdown';

interface UserProfileDropdownProps {
  userName: string;
  userInitial: string;
  onClose: () => void;
  isDark: boolean;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = memo(({
  userName,
  userInitial,
  onClose,
  isDark
}) => (
  <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-50 transition-colors ${
    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  }`}>
    <div className={`p-4 border-b transition-colors ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src="" alt={userName} />
          <AvatarFallback className="bg-green-600 text-white">
            {userInitial}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className={`font-semibold transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {userName}
          </p>
          <p className={`text-sm transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Premium Member
          </p>
        </div>
      </div>
    </div>
    <div className="p-2">
      <Button variant="ghost" size="sm" className={`w-full justify-start transition-colors ${
        isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
      }`}>
        Profile Settings
      </Button>
      <Button variant="ghost" size="sm" className={`w-full justify-start transition-colors ${
        isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
      }`}>
        Account Settings
      </Button>
      <Button variant="ghost" size="sm" className={`w-full justify-start text-red-600 hover:bg-red-50`} onClick={onClose}>
        Sign Out
      </Button>
    </div>
  </div>
));

UserProfileDropdown.displayName = 'UserProfileDropdown';
