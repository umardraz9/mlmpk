'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

interface OnlineUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  level: number;
  verified: boolean;
  membershipPlan: string;
  partnerLevel: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActive: string;
  joinedDate: string;
}

interface OnlineStatusProps {
  onUserClick?: (user: OnlineUser) => void;
}

export default function OnlineStatus({ onUserClick }: OnlineStatusProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Fetch real online users from API
  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch('/api/social/users?type=online&limit=20');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOnlineUsers(data.users);
        }
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();

    // Update every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const formatLastActive = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch (error) {
      return 'Recently';
    }
  };

  const displayedUsers = showAll ? onlineUsers : onlineUsers.slice(0, 6);
  const onlineCount = onlineUsers.filter(u => u.status === 'online').length;
  const totalCount = onlineUsers.length;

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Circle className="h-3 w-3 text-green-500 fill-current" />
            <span className="text-gray-900">Team Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {onlineCount} Online
            </Badge>
            <Badge variant="outline" className="text-gray-600">
              {totalCount} Total
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {displayedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onUserClick?.(user)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${getStatusColor(user.status)}`}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    {user.verified && (
                      <span className="text-blue-500 text-xs">✓</span>
                    )}
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      L{user.level}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {getStatusText(user.status)}
                    </span>
                    {user.status !== 'online' && (
                      <span className="text-xs text-gray-400">
                        • {formatLastActive(user.lastActive)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {onlineUsers.length > 6 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
            >
              Show all {onlineUsers.length} members
            </button>
          )}

          {showAll && onlineUsers.length > 6 && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full text-center text-gray-500 hover:text-gray-700 text-sm font-medium py-2"
            >
              Show less
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center space-x-2 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Circle className="h-4 w-4" />
              <span>Start Live Chat</span>
            </button>
            <button className="flex items-center justify-center space-x-2 p-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <Circle className="h-4 w-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
