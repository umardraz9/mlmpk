'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { TouchButton } from '@/components/ui/mobile-touch';
import ThemeToggle from '@/components/ThemeToggle';

// Import optimized components
import { NotificationDropdown } from '@/components/dashboard/DashboardHeader';
import { MessageDropdown } from '@/components/dashboard/DashboardHeader';
import { UserProfileDropdown } from '@/components/dashboard/DashboardHeader';
import { DashboardActions } from '@/components/dashboard/DashboardStats';
import { StatsOverview } from '@/components/dashboard/DashboardStats';
import { TaskProgress } from '@/components/dashboard/TaskProgress';
import { ReferralSection } from '@/components/dashboard/ReferralSection';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { MembershipDetails } from '@/components/dashboard/MembershipDetails';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

// Types
interface UserStats {
  totalEarnings: number;
  voucherBalance: number;
  totalReferrals: number;
  directReferrals: number;
  hasInvested: boolean;
  isActive: boolean;
  referralCode: string;
  membershipPlan?: {
    id: string;
    name: string;
    displayName: string;
    price: number;
    dailyTaskEarning: number;
    maxEarningDays: number;
    extendedEarningDays: number;
    minimumWithdrawal: number;
    voucherAmount: number;
    tasksPerDay?: number;
  };
  membershipStatus?: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
  dailyEarningsToday?: number;
  totalTaskEarnings?: number;
  earningDaysRemaining?: number;
  perTaskAmount?: number;
  tasksPerDay?: number;
  earningEndsAt?: string | null;
  eligible?: boolean;
  activeDays?: number;
  commissionBreakdown: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
  };
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'money' | 'event' | 'warning' | 'info';
  read?: boolean;
}

// Main Dashboard Component
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDark } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(3);
  const [messageCount] = useState(2);
  const [todayTasks, setTodayTasks] = useState<unknown[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load notifications from database
  useEffect(() => {
    const loadNotifications = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/notifications/display', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.notifications) {
            const realNotifications = data.notifications.map((notif: {
              id: number;
              title: string;
              message: string;
              createdAt: string;
              type?: string;
              isRead: boolean;
            }) => ({
              id: notif.id,
              title: notif.title,
              message: notif.message,
              time: new Date(notif.createdAt).toLocaleString(),
              type: notif.type || 'info',
              read: notif.isRead
            }));
            setNotifications(realNotifications);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard notifications:', error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [status]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetchUserStats();
    }
  }, [status, router]);

  // Load today's tasks
  useEffect(() => {
    if (status !== 'authenticated') return;
    const load = async () => {
      try {
        const res = await fetch('/api/tasks?limit=5', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const shortlist = (data.tasks || [])
            .filter((t: { canStart?: boolean; isInProgress?: boolean }) => t.canStart || t.isInProgress)
            .slice(0, 3);
          setTodayTasks(shortlist);
        }
      } catch (e) {
        console.error("Error loading today's tasks:", e);
      }
    };
    load();
  }, [status]);

  // Update notification count
  useEffect(() => {
    const unreadCount = notifications.filter(notif => !notif.read).length;
    setNotificationCount(unreadCount);
  }, [notifications]);


  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.voucherBalance === 0 && data.membershipPlan?.name === 'STANDARD') {
          data.voucherBalance = 1000;
        }
        setStats(data);
      } else {
        console.error('Failed to fetch user stats - using fallback data');
        setStats({
          totalEarnings: 610,
          voucherBalance: 1000,
          totalReferrals: 12,
          directReferrals: 5,
          hasInvested: true,
          isActive: true,
          referralCode: 'MCN' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          membershipPlan: {
            id: '1',
            name: 'STANDARD',
            displayName: 'Standard Plan',
            price: 3000,
            dailyTaskEarning: 150,
            maxEarningDays: 30,
            extendedEarningDays: 60,
            minimumWithdrawal: 4000,
            voucherAmount: 1000
          },
          membershipStatus: 'ACTIVE',
          membershipStartDate: new Date().toISOString(),
          membershipEndDate: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000)).toISOString(),
          dailyEarningsToday: 150,
          totalTaskEarnings: 2250,
          earningDaysRemaining: 45,
          commissionBreakdown: {
            level1: 1000,
            level2: 750,
            level3: 500,
            level4: 200,
            level5: 50
          }
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Return safe default data for new users (NO FREE PLANS!)
      setStats({
        totalEarnings: 0,
        voucherBalance: 0, // No free vouchers
        totalReferrals: 0,
        directReferrals: 0,
        hasInvested: false, // User has NOT invested
        isActive: true,
        referralCode: '',
        commissionBreakdown: {
          level1: 0,
          level2: 0,
          level3: 0,
          level4: 0,
          level5: 0
        },
        membershipPlan: null, // No plan until payment
        membershipStatus: 'INACTIVE', // User must pay to activate
        membershipStartDate: null,
        membershipEndDate: null,
        dailyEarningsToday: 0,
        totalTaskEarnings: 0,
        earningDaysRemaining: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Loading state
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (!stats) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'
      }`}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className={`transition-colors ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>Failed to load dashboard data</p>
          <Button onClick={fetchUserStats} className="mt-4 bg-green-600 hover:bg-green-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'
    }`}>
      {/* Desktop Header */}
      <div className={`shadow-sm border-b sticky top-0 z-40 hidden md:block transition-colors duration-300 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className={`text-xl font-bold transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>MCNmart Dashboard</h1>
                <p className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <DashboardActions
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                isDark={isDark}
              />

              <ThemeToggle />

              {/* Messages Dropdown */}
              <div className="relative" ref={messageRef}>
                <TouchButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMessages(!showMessages)}
                  className={`relative p-2 transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {messageCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                      {messageCount}
                    </div>
                  )}
                </TouchButton>

                {showMessages && (
                  <MessageDropdown
                    messageCount={messageCount}
                    onClose={() => setShowMessages(false)}
                    isDark={isDark}
                  />
                )}
              </div>

              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationRef}>
                <TouchButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {notificationCount}
                    </div>
                  )}
                </TouchButton>

                {showNotifications && (
                  <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onMarkAsRead={markAsRead}
                    isDark={isDark}
                  />
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <TouchButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfile(!showProfile)}
                  className={`flex items-center space-x-2 p-2 transition-colors ${
                    isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white text-sm font-semibold">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </TouchButton>

                {showProfile && (
                  <UserProfileDropdown
                    userName={session?.user?.name || 'User'}
                    userInitial={session?.user?.name?.charAt(0) || 'U'}
                    onClose={() => setShowProfile(false)}
                    isDark={isDark}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Overview */}
        <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>}>
          <StatsOverview stats={stats} isDark={isDark} />
        </Suspense>

        {/* Membership Details */}
        <div className="mb-8">
          <MembershipDetails stats={stats} isDark={isDark} />
        </div>

        {/* Task Progress */}
        <div className="mb-8">
          <TaskProgress stats={stats} todayTasks={todayTasks} isDark={isDark} />
        </div>

        {/* Referral Section */}
        <div className="mb-8">
          <ReferralSection stats={stats} isDark={isDark} />
        </div>

        {/* Quick Actions */}
        <QuickActions isDark={isDark} />
      </div>
    </div>
  );
}
