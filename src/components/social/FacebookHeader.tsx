'use client';

import React, { useState } from 'react';
import { useSession, signOut } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RealTimeNotifications from './RealTimeNotifications';
import {
  Home,
  Search,
  MessageCircle,
  Users,
  ChevronDown,
  Settings,
  HelpCircle,
  LogOut,
  User
} from 'lucide-react';

export default function FacebookHeader() {
    <div className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo and Search */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h1 className="text-xl font-bold text-blue-600 hidden md:block">MLM-Pak</h1>
            </div>

            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search MLM-Pak"
                className="pl-10 bg-gray-100 border-none rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Center Section - Navigation Icons */}
          <div className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 px-3">
              <Home className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 px-3">
              <Users className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 px-3">
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>

          {/* Right Section - Notifications and User Menu */}
          <div className="flex items-center space-x-2">
            <RealTimeNotifications />

            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {session?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session?.user?.email || ''}
                      </p>
                    </div>

                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </button>

                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Settings & Privacy</span>
                    </button>

                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <HelpCircle className="h-4 w-4" />
                      <span>Help & Support</span>
                    </button>

                    <div className="border-t border-gray-200 mt-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Show only on small screens */}
        <div className="md:hidden mt-3 flex items-center justify-center space-x-4 border-t pt-3">
          <Button variant="ghost" size="sm" className="text-blue-600">
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600">
            <Users className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600">
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
}
