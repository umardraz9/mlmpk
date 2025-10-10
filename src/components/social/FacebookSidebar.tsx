'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Home,
  Users,
  Calendar,
  Clock,
  Bookmark,
  TrendingUp,
  MessageCircle,
  UserPlus,
  Video,
  Store,
  ChevronDown
} from 'lucide-react';

interface FacebookSidebarProps {
  onNavigate?: (section: string) => void;
}

export default function FacebookSidebar({ onNavigate }: FacebookSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const menuItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Users, label: 'Friends', active: false },
    { icon: UserPlus, label: 'Friend Requests', active: false, badge: 3 },
    { icon: MessageCircle, label: 'Messenger', active: false },
    { icon: Video, label: 'Videos', active: false },
    { icon: Calendar, label: 'Events', active: false },
    { icon: Store, label: 'Marketplace', active: false },
    { icon: Bookmark, label: 'Saved', active: false },
    { icon: TrendingUp, label: 'Most Recent', active: false },
    { icon: Clock, label: 'Memories', active: false }
  ];

  const handleNavigate = (label: string) => {
    const key = label.toLowerCase();
    const routes: Record<string, string> = {
      'home': '/social',
      'friends': '/social/people',
      'friend requests': '/social/people?tab=requests',
      'messenger': '/messages',
      'videos': '/social/reels',
      'events': '/dashboard',
      'marketplace': '/products',
      'saved': '/favorites',
      'most recent': '/social',
      'memories': '/social',
    };
    const path = routes[key];
    if (path) {
      router.push(path);
    } else {
      onNavigate?.(key);
    }
  };

  return (
    <div className="bg-white w-full lg:w-80 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
      <div className="p-3">
        {/* User Profile Section */}
        <div className="mb-4">
          <Button
            variant="ghost"
            className="w-full justify-start p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => router.push('/social/profile')}
          >
            <Avatar className="h-9 w-9 mr-3">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {session?.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-gray-900 text-[15px]">
              {session?.user?.name || 'User'}
            </span>
          </Button>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`w-full justify-start p-2 hover:bg-gray-100 rounded-lg ${
                item.active ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
              onClick={() => handleNavigate(item.label)}
            >
              <item.icon className="h-5 w-5 mr-3 text-blue-600" />
              <span className="font-medium text-[15px]">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* See More */}
        <div className="mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start p-2 hover:bg-gray-100 rounded-lg text-gray-700"
            onClick={() => router.push('/dashboard')}
          >
            <ChevronDown className="h-5 w-5 mr-3 text-gray-600" />
            <span className="font-medium text-[15px]">See more</span>
          </Button>
        </div>
        {/* Your shortcuts */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-gray-600 font-medium text-[15px] mb-3 px-2">
            Your shortcuts
          </h3>

          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start p-2 hover:bg-gray-100 rounded-lg text-gray-700"
              onClick={() => router.push('/dashboard')}
            >
              <div className="h-9 w-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium text-[15px]">Team Dashboard</span>
              <span className="text-xs text-green-600 ml-auto">Active</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
