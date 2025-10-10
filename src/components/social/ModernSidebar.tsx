/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Users,
  Bell,
  Mail,
  TrendingUp,
  Award,
  Play,
  ExternalLink,
  Heart,
  MessageCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface ModernSidebarProps {
  recentReels?: any[];
  recentNotifications?: any[];
  recentMessages?: any[];
  isLoading?: boolean;
}

export default function ModernSidebar({
  recentReels = [],
  recentNotifications = [],
  recentMessages = [],
  isLoading = false
}: ModernSidebarProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState<'reels' | 'notifications' | 'messages'>('reels');

  const sidebarSections = [
    {
      id: 'reels',
      title: 'Recent Reels',
      icon: Video,
      color: isDark ? 'text-purple-400' : 'text-purple-600',
      bgColor: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
      gradient: 'from-purple-500 to-purple-600',
      items: recentReels
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      color: isDark ? 'text-orange-400' : 'text-orange-600',
      bgColor: isDark ? 'bg-orange-900/20' : 'bg-orange-50',
      gradient: 'from-orange-500 to-orange-600',
      items: recentNotifications
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: Mail,
      color: isDark ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      gradient: 'from-blue-500 to-blue-600',
      items: recentMessages
    }
  ];

  const selectedSectionData = sidebarSections.find(section => section.id === selectedSection);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-12 h-16 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className={`flex gap-2 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {sidebarSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedSection === section.id
                  ? `${isDark ? 'bg-gray-700 text-gray-200' : 'bg-white shadow-sm'} ${section.color}`
                  : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{section.title}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Section Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${selectedSectionData?.bgColor}`}>
                <selectedSectionData.icon className={`h-5 w-5 ${selectedSectionData?.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900">
                {selectedSectionData?.title}
              </h3>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {selectedSection === 'reels' && (
            <ReelsSection reels={recentReels} />
          )}
          {selectedSection === 'notifications' && (
            <NotificationsSection notifications={recentNotifications} />
          )}
          {selectedSection === 'messages' && (
            <MessagesSection messages={recentMessages} />
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 bg-gradient-to-br from-social-gradient-from to-social-gradient-to text-white">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Quick Actions
          </h4>
          <div className="space-y-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => router.push('/social/reels')}
            >
              <Video className="h-4 w-4 mr-2" />
              Create Reel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => router.push('/social/people')}
            >
              <Users className="h-4 w-4 mr-2" />
              Find Friends
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => router.push('/admin/analytics/users')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Trending Topics
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { topic: '#MLMSuccess', posts: '1.2k posts', trending: true },
              { topic: '#BusinessTips', posts: '892 posts', trending: true },
              { topic: '#NetworkMarketing', posts: '654 posts', trending: false },
              { topic: '#EntrepreneurLife', posts: '423 posts', trending: false }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.topic}</span>
                    {item.trending && (
                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                        Trending
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{item.posts}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReelsSection({ reels }: { reels: any[] }) {
  if (reels.length === 0) {
    return (
      <div className="text-center py-8">
        <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-3">No reels yet</p>
        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
          <Play className="h-4 w-4 mr-2" />
          Watch Trending
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {reels.slice(0, 4).map((reel) => (
        <div
          key={reel.id}
          className="relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden cursor-pointer group hover:scale-105 transition-transform"
        >
          {reel.videoUrl ? (
            <video
              src={reel.videoUrl}
              className="w-full h-full object-cover"
              muted
              poster={reel.coverUrl}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <Play className="h-8 w-8 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-8 w-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-white text-xs line-clamp-2 drop-shadow-lg">
              {reel.content}
            </p>
          </div>
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 text-white text-xs bg-black/50 px-2 py-1 rounded">
              <Heart className="h-3 w-3" />
              {reel.likes}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsSection({ notifications }: { notifications: any[] }) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.slice(0, 3).map((notification) => (
        <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className={`p-2 rounded-full ${
            notification.type === 'message' ? 'bg-blue-100' :
            notification.type === 'like' ? 'bg-red-100' :
            notification.type === 'comment' ? 'bg-green-100' :
            'bg-gray-100'
          }`}>
            {notification.type === 'message' && <Mail className="h-4 w-4 text-blue-600" />}
            {notification.type === 'like' && <Heart className="h-4 w-4 text-red-600" />}
            {notification.type === 'comment' && <MessageCircle className="h-4 w-4 text-green-600" />}
            {!['message', 'like', 'comment'].includes(notification.type) && <Bell className="h-4 w-4 text-gray-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
            <p className="text-xs text-gray-600 truncate">{notification.message}</p>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">
                {new Date(notification.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {!notification.isRead && (
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
          )}
        </div>
      ))}
    </div>
  );
}

function MessagesSection({ messages }: { messages: any[] }) {
  const router = useRouter();
  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No messages yet</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/messages')}>
          Start Messaging
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.slice(0, 3).map((message) => (
        <div key={message.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.sender.avatar} />
            <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm text-gray-900 truncate">{message.sender.name}</p>
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">{message.preview}</p>
          </div>
          {message.unread && (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
        </div>
      ))}
    </div>
  );
}
