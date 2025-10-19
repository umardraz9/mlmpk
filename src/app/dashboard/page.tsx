'use client';

export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MobileLayout,
  MobilePageContainer,
  MobileSection,
  MobileCard
} from '@/components/layout/mobile-layout';
import { TouchButton } from '@/components/ui/mobile-touch';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import {
  TrendingUp,
  Users,
  Wallet,
  Gift,
  Copy,
  Share2,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  X,
  Calendar,
  ArrowRight,
  Target,
  ShoppingBag,
  FileText,
  Settings,
  Star,
  Zap,
  Award,
  DollarSign,
  LogOut,
  BarChart3,
  Activity,
  UserCheck,
  Package,
  Crown,
  Heart,
  Mail,
  ChevronDown,
  RefreshCcw,
  Headphones,
  BookOpen
} from 'lucide-react';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { profileService, type ProfileData } from '@/lib/profile-service';


// Mini chart components (no external deps)
function Sparkline({ data, width = 200, height = 50, stroke = '#10b981' }: { data: number[]; width?: number; height?: number; stroke?: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const step = width / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} />
    </svg>
  );
}

function RingProgress({ size = 120, value, color = '#3b82f6', trackColor = '#e5e7eb' }: { size?: number; value: number; color?: string; trackColor?: string }) {
  const degree = Math.max(0, Math.min(100, value)) * 3.6;
  return (
    <div
      className="rounded-full grid place-items-center"
      style={{ width: size, height: size, background: `conic-gradient(${color} ${degree}deg, ${trackColor} 0deg)` }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-full" style={{ width: size - 16, height: size - 16 }} />
    </div>
  );
}

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
  totalEarningDays?: number;
  completionsToday?: number;
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

interface InboxUserStub { id: string; name?: string | null; avatar?: string | null }
interface InboxMessage {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  sender: InboxUserStub;
  recipient: InboxUserStub;
  senderId: string;
  recipientId: string;
  unread: boolean;
}

// Dashboard component that uses search params
function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDark } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [inbox, setInbox] = useState<InboxMessage[]>([]);
  // Profile menu now uses Radix DropdownMenu (no local state needed)
  const [todayTasks, setTodayTasks] = useState<unknown[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  // Removed profileRef: Radix handles interactions
  // const [activeTab, setActiveTab] = useState('overview');
  // const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const searchParams = useSearchParams();
  type PaymentBannerStatus = 'PENDING' | 'REJECTED' | 'ACCEPTED';
  const [paymentBanner, setPaymentBanner] = useState<{ status: PaymentBannerStatus; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const cacheSnapshot = useCallback((payload: UserStats) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('dashboardSnapshot', JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to cache dashboard snapshot:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cached = window.localStorage.getItem('dashboardSnapshot');
    if (!cached) return;

    try {
      const parsed: UserStats = JSON.parse(cached);
      setStats(parsed);
      setLoading(false);
    } catch (error) {
      console.error('Failed to parse cached dashboard snapshot:', error);
    }
  }, [status]);

  // Load profile image
  useEffect(() => {
    if (status !== 'authenticated') return;
    let unsubscribe = () => {};
    (async () => {
      try {
        const data = await profileService.fetchProfile();
        if (data) setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    })();
    unsubscribe = profileService.onProfileUpdate((p) => setProfile(p));
    return unsubscribe;
  }, [status]);

  // Load real notifications from database (optimized)
  useEffect(() => {
    const loadNotifications = async () => {
      if (status !== 'authenticated') return;
      try {
        const response = await fetch('/api/notifications/display?limit=5', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.notifications) {
            const realNotifications = data.notifications.map((notif: any) => {
              const safeTitle = typeof notif.title === 'string' ? notif.title : String(notif.title ?? 'Notification');
              const rawMsg = notif.message ?? notif.content ?? '';
              const safeMessage = typeof rawMsg === 'string' ? rawMsg : String(rawMsg);
              return {
                id: String(notif.id),
                title: safeTitle,
                message: safeMessage,
                time: new Date(notif.createdAt).toLocaleString(),
                type: typeof notif.type === 'string' ? notif.type : 'info',
                read: Boolean(notif.isRead)
              } as Notification;
            });
            setNotifications(realNotifications);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard notifications:', error);
      }
    };

    const notificationTimeoutId = setTimeout(loadNotifications, 800);
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      clearTimeout(notificationTimeoutId);
      clearInterval(interval);
    };
  }, [status]);

  // Define fetchUserStats before using it in useEffect
  const fetchUserStats = useCallback(async () => {
    setIsSyncing(true);
    try {
      console.log('📊 Dashboard: Fetching user stats...');
      const response = await fetch('/api/user/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📊 Dashboard: Response status:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard API Response:', data);
        setStats(data);
        cacheSnapshot(data);
      } else {
        const errorText = await response.text();
        console.error('📊 Dashboard: API error response:', errorText);
        throw new Error(`Failed to fetch user stats: ${response.status}`);
      }
    } catch (error) {
      console.error('📊 Dashboard: Error fetching user stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [cacheSnapshot]);

  useEffect(() => {
    console.log('📊 Dashboard: Session status:', status);
    
    if (!status) return; // Wait for status to be initialized
    
    if (status === 'unauthenticated') {
      console.log('📊 Dashboard: User not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      console.log('📊 Dashboard: User authenticated, fetching stats');
      fetchUserStats();
    } else if (status === 'loading') {
      console.log('📊 Dashboard: Session still loading...');
    }
  }, [status, router, fetchUserStats]);

  // Load a small snapshot of today's tasks for quick access (optimized)
  useEffect(() => {
    if (!status || status !== 'authenticated') return;
    
    // Delay task loading to prioritize stats
    const taskTimeoutId = setTimeout(async () => {
      try {
        const res = await fetch('/api/tasks?limit=3', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const shortlist = (data.tasks || [])
            .filter((t: { canStart?: boolean; isInProgress?: boolean }) => t.canStart || t.isInProgress)
            .slice(0, 2);
          setTodayTasks(shortlist);
        }
      } catch (e) {
        console.error("Error loading today's tasks:", e);
      }
    }, 1200);
    
    return () => clearTimeout(taskTimeoutId);
  }, [status]);

  // Update notification count (memoized)
  useEffect(() => {
    const unreadCount = notifications.filter(notif => !notif.read).length;
    if (unreadCount !== notificationCount) {
      setNotificationCount(unreadCount);
    }
  }, [notifications, notificationCount]);

  // Update message count based on inbox unread (memoized)
  useEffect(() => {
    const unread = inbox.filter((m) => m.unread).length;
    if (unread !== messageCount) {
      setMessageCount(unread);
    }
  }, [inbox, messageCount]);

  // Show payment status banner based on URL param, membership status, or notifications
  useEffect(() => {
    if (!status || status !== 'authenticated') return;

    const param = searchParams.get('payment');
    let banner: { status: PaymentBannerStatus; message: string } | null = null;

    // Fallback to localStorage pending flag (in case user returns later without URL param)
    try {
      const pending = typeof window !== 'undefined' ? localStorage.getItem('pendingManualPayment') : null;
      if (pending === '1' && param !== 'pending') {
        banner = {
          status: 'PENDING',
          message:
            'We have received your payment proof. Your payment is under review. We will activate your account within 24 hours after confirmation.'
        };
      }
    } catch {}

    if (param === 'pending') {
      banner = {
        status: 'PENDING',
        message:
          'We have received your payment proof. Your payment is under review. We will activate your account within 24 hours after confirmation.'
      };
    } else if (stats?.membershipStatus === 'ACTIVE') {
      // If membership is already ACTIVE, no need to show activation/payment banner
      banner = null;
    } else {
      // Infer from notifications if available
      const hasRejected = notifications.some(n => n.title?.toLowerCase().includes('payment rejected'));
      const hasApproved = notifications.some(n => n.title?.toLowerCase().includes('payment approved'));

      if (hasRejected) {
        banner = {
          status: 'REJECTED',
          message: 'Your payment was rejected. Please resubmit correct details or contact support.'
        };
      } else if (hasApproved) {
        banner = {
          status: 'ACCEPTED',
          message: 'Payment accepted! Welcome — your account will be activated shortly.'
        };
      }
    }

    // Clear pending flag when we have a final decision
    if (typeof window !== 'undefined') {
      if (banner && banner.status !== 'PENDING') {
        try { localStorage.removeItem('pendingManualPayment'); } catch {}
      }
    }

    setPaymentBanner(banner);
  }, [status, stats?.membershipStatus, notifications, searchParams]);

  // Task meta now comes from /api/user/stats; no extra fetch needed

  // Close dropdowns when clicking outside (messages/notifications only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // fetchUserStats is now defined above where it's used

  // Task meta is now included in /api/user/stats

  const copyReferralCode = useCallback(async () => {
    if (stats?.referralCode) {
      try {
        await navigator.clipboard.writeText(stats.referralCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy referral code:', err);
      }
    }
  }, [stats?.referralCode]);

  const shareReferralLink = useCallback(async () => {
    const referralLink = `${window.location.origin}/register?ref=${stats?.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join MCNmart',
          text: 'Join MCNmart and start earning with my referral code!',
          url: referralLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(referralLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy referral link:', err);
      }
    }
  }, [stats?.referralCode]);

  const markAsRead = useCallback((notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchUserStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [fetchUserStats]);

  // Derived task metrics for quick glance (memoized for performance - computed before early returns)
  const taskMetrics = useMemo(() => {
    if (!stats) return { tasksPerDayVal: 5, completionsVal: 0, perTaskAmountVal: 0, tasksLeftVal: 5, completionPct: 0, earningsTrend: [0] };
    
    const tasksPerDayVal = stats.tasksPerDay ?? stats.membershipPlan?.tasksPerDay ?? 5;
    const completionsVal = stats.completionsToday ?? 0;
    const perTaskAmountVal = Math.round(stats.perTaskAmount ?? (stats.membershipPlan ? stats.membershipPlan.dailyTaskEarning / tasksPerDayVal : 0));
    const tasksLeftVal = Math.max(0, tasksPerDayVal - completionsVal);
    const completionPct = Math.min(100, Math.round((completionsVal / Math.max(1, tasksPerDayVal)) * 100));
    const earningsTrend = [80, 95, 70, 110, 130, 100, (completionsVal * perTaskAmountVal)];
    
    return {
      tasksPerDayVal,
      completionsVal,
      perTaskAmountVal,
      tasksLeftVal,
      completionPct,
      earningsTrend
    };
  }, [stats]);

  const { tasksPerDayVal, completionsVal, perTaskAmountVal, tasksLeftVal, completionPct, earningsTrend } = taskMetrics;

  // Show loading state while session or stats are loading
  if (loading || status !== 'authenticated') {
    return <DashboardSkeleton />;
  }

  // Show error state only if we have a status and no stats
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

  const quickActions = [
    {
      title: 'Start Tasks',
      description: 'Complete daily tasks to earn money',
      icon: Target,
      href: '/tasks',
      gradient: 'from-emerald-500 to-green-600'
    },
    {
      title: 'Shop Products',
      description: 'Browse and purchase products',
      icon: ShoppingBag,
      href: '/products',
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'Read Articles',
      description: 'Latest tips and insights',
      icon: BookOpen,
      href: '/blog',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Social Hub',
      description: 'Connect with your network',
      icon: Users,
      href: '/social',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'My Orders',
      description: 'View order history',
      icon: Package,
      href: '/orders',
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      title: 'My Team',
      description: 'View your referral network',
      icon: Users,
      href: '/team',
      gradient: 'from-emerald-600 to-cyan-500'
    },
    {
      title: 'Guide',
      description: 'Learn how to maximize earnings',
      icon: BookOpen,
      href: '/guide',
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      title: 'Settings',
      description: 'Account preferences',
      icon: Settings,
      href: '/settings',
      gradient: 'from-slate-600 to-slate-800'
    }
  ] as const;

  return (
    <MobileLayout showBottomNav={true}>
      <MobilePageContainer>
        {/* Secondary header (hide on mobile to prevent double headers) */}
        <div className={`hidden md:block shadow-sm border-b sticky top-0 z-40 transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
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
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* Desktop Notifications - unified with social NotificationDropdown */}
                <NotificationDropdown className="hidden md:block" />

                {/* User Profile Menu - Radix Dropdown for reliable desktop interactions */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Open profile menu"
                      className={`flex items-center space-x-2 p-2 transition-colors ${
                        isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.image || session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                        <AvatarFallback className="bg-green-600 text-white text-sm">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      side="bottom"
                      sideOffset={8}
                      align="end"
                      collisionPadding={8}
                      className={`w-64 max-w-[90vw] rounded-lg shadow-lg border z-[70] transition-colors ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className={`p-4 border-b transition-colors ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={profile?.image || session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                            <AvatarFallback className="bg-green-600 text-white">
                              {session?.user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`font-semibold transition-colors ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>{String(session?.user?.name || 'User')}</p>
                            <p className={`text-sm transition-colors ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>{String(session?.user?.email || '')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <DropdownMenu.Item
                          onSelect={() => router.push('/profile')}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm outline-none cursor-pointer ${
                            isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <User className="h-4 w-4" />
                          <span>View Profile</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          onSelect={() => router.push('/settings')}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm outline-none cursor-pointer ${
                            isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Account Settings</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          onSelect={() => router.push('/favorites')}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm outline-none cursor-pointer ${
                            isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          <Heart className="h-4 w-4" />
                          <span>Favorites</span>
                        </DropdownMenu.Item>

                        <div className={`border-t my-2 transition-colors ${
                          isDark ? 'border-gray-700' : 'border-gray-200'
                        }`} />

                        <DropdownMenu.Item
                          onSelect={() => signOut({ callbackUrl: '/auth/login' })}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm outline-none cursor-pointer text-red-600 ${
                            isDark ? 'hover:bg-gray-700' : 'hover:bg-red-50'
                          }`}
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </DropdownMenu.Item>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status Banner */}
        {paymentBanner && (
          <div
            className={`rounded-xl p-4 mt-4 border-l-4 transition-all duration-300 ${
              paymentBanner.status === 'PENDING'
                ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50'
                : paymentBanner.status === 'REJECTED'
                ? 'border-red-500 bg-gradient-to-r from-red-50 to-rose-50'
                : 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  paymentBanner.status === 'PENDING'
                    ? 'bg-orange-500'
                    : paymentBanner.status === 'REJECTED'
                    ? 'bg-red-500'
                    : 'bg-green-600'
                }`}
              >
                {paymentBanner.status === 'ACCEPTED' ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold mb-1 ${
                    paymentBanner.status === 'PENDING'
                      ? 'text-orange-800'
                      : paymentBanner.status === 'REJECTED'
                      ? 'text-red-800'
                      : 'text-green-800'
                  }`}
                >
                  {paymentBanner.status === 'PENDING'
                    ? 'Payment Under Review'
                    : paymentBanner.status === 'REJECTED'
                    ? 'Payment Rejected'
                    : 'Payment Accepted — Welcome!'}
                </p>
                <p
                  className={`text-sm mb-3 ${
                    paymentBanner.status === 'PENDING'
                      ? 'text-orange-700'
                      : paymentBanner.status === 'REJECTED'
                      ? 'text-red-700'
                      : 'text-green-700'
                  }`}
                >
                  {paymentBanner.message}
                </p>

                <div className="flex flex-wrap gap-2">
                  {paymentBanner.status === 'REJECTED' && (
                    <>
                      <Button onClick={() => router.push('/payment')} size="sm" className="bg-red-600 hover:bg-red-700">
                        Resubmit Proof
                      </Button>
                      <Button onClick={() => router.push('/support')} variant="outline" size="sm">
                        Contact Support
                      </Button>
                    </>
                  )}
                  {paymentBanner.status === 'ACCEPTED' && (
                    <Button onClick={() => router.push('/tasks')} size="sm" className="bg-green-600 hover:bg-green-700">
                      Start Tasks
                    </Button>
                  )}
                </div>
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => setPaymentBanner(null)}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Essentials & Quick Actions */}
        <div className="px-4 md:px-6 mt-6 space-y-6">
          <section className={`rounded-3xl border p-6 backdrop-blur-sm transition-all duration-300 shadow-xl ${isDark ? 'bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 border-gray-700/50' : 'bg-gradient-to-br from-white/90 via-slate-50/80 to-white/90 border-gray-200/60'}`}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h2 className={`text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent ${isDark ? 'from-emerald-400 to-teal-400' : ''}`}>Essential Snapshot</h2>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Stay informed about balances, today&apos;s tasks, and membership health while detailed data syncs in the background.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSyncing ? (
                    <Badge className="bg-blue-600/20 text-blue-600 border border-blue-500/30 animate-pulse">
                      <RefreshCcw className="w-3 h-3 mr-1 animate-spin" />
                      Updating
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Up to date
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
              <div className={`rounded-2xl p-4 border transition-colors ${isDark ? 'bg-gray-800/60 border-gray-700/70' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Earnings</p>
                    <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      PKR {Number(stats?.totalEarnings ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className={`text-xs mt-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Combined rewards from tasks and referrals.</p>
              </div>

              <div className={`rounded-2xl p-4 border transition-colors ${isDark ? 'bg-gray-800/60 border-gray-700/70' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Voucher Balance</p>
                    <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      PKR {Number(stats?.voucherBalance ?? stats?.membershipPlan?.voucherAmount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className={`text-xs mt-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Use vouchers for discounted marketplace purchases.</p>
              </div>

              <div className={`rounded-2xl p-4 border transition-colors ${isDark ? 'bg-gray-800/60 border-gray-700/70' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Today&apos;s Tasks</p>
                    <p className={`text-2xl font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {completionsVal}/{tasksPerDayVal}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-orange-500/25">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className={`text-xs mt-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Earn PKR {perTaskAmountVal} per task • {tasksLeftVal} remaining today.</p>
              </div>

              <div className={`rounded-2xl p-4 border transition-colors ${isDark ? 'bg-gray-800/60 border-gray-700/70' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Active Plan</p>
                    <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stats?.membershipPlan?.displayName || stats?.membershipPlan?.name || 'No Plan'}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                    stats?.membershipStatus === 'ACTIVE' 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 group-hover:shadow-green-500/25' 
                      : 'bg-gradient-to-br from-gray-500 to-slate-500 group-hover:shadow-gray-500/25'
                  }`}>
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className={`text-xs mt-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stats?.membershipStatus ?? 'INACTIVE'} • {stats?.earningDaysRemaining ?? 0} days left.
                </p>
              </div>
            </div>
            </div>
          </section>

          <section className={`rounded-3xl border p-6 backdrop-blur-sm transition-all duration-300 shadow-xl ${isDark ? 'bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 border-gray-700/50' : 'bg-gradient-to-br from-white/90 via-slate-50/80 to-white/90 border-gray-200/60'}`}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h2 className={`text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent ${isDark ? 'from-purple-400 to-pink-400' : ''}`}>Quick Actions</h2>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Access frequently used features.</p>
              </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className={`inline-flex items-center gap-2 ${isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh data'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <TouchButton
                    key={action.title}
                    onClick={() => router.push(action.href)}
                    className={`group flex items-start gap-4 p-4 h-full rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${isDark ? 'bg-gray-800/60 border-gray-700/50 hover:bg-gray-700/60' : 'bg-white/80 border-gray-200/60 hover:bg-white/90'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}> 
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{action.title}</h3>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{action.description}</p>
                    </div>
                  </TouchButton>
                );
              })}
            </div>
            </div>
          </section>
        </div>

        {/* Active Plan Details Section (only when active) */}
        {stats?.membershipStatus === 'ACTIVE' && (
          <div className="px-4 md:px-6 mt-6">
            <div className={`rounded-3xl border backdrop-blur-sm transition-all duration-300 ${isDark ? 'bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-purple-900/20 border-blue-700/30 shadow-blue-900/20' : 'bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 border-blue-200/60 shadow-blue-100/50'}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {stats.membershipStatus === 'ACTIVE' ? 'Active Membership Plan' : 'Membership Plan'}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your current subscription details</p>
                    </div>
                  </div>
                  
                  <div
                    className={
                      `px-4 py-2 rounded-full text-sm font-semibold border ` +
                      (
                        stats.membershipStatus === 'ACTIVE'
                          ? (isDark ? 'bg-green-900/50 text-green-200 border-green-800' : 'bg-green-100 text-green-800 border-green-200')
                          : stats.membershipStatus === 'EXPIRED'
                            ? (isDark ? 'bg-red-900/40 text-red-200 border-red-800' : 'bg-red-100 text-red-800 border-red-200')
                            : (isDark ? 'bg-gray-800/60 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200')
                      )
                    }
                  >
                    {stats.membershipStatus}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Plan Info Card */}
                  <div className={`rounded-2xl border p-5 ${isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/60'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Plan Details</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your membership tier</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats?.membershipPlan?.displayName ?? '—'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {stats?.membershipPlan?.name ?? '—'}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            stats?.membershipStatus === 'ACTIVE'
                              ? (isDark ? 'bg-green-900/50 text-green-200 border-green-800' : 'bg-green-100 text-green-800 border-green-200')
                              : (isDark ? 'bg-gray-800/60 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200')
                          }`}>
                            {stats?.membershipStatus ?? '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Plan Cost:</span>
                          <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {stats?.membershipPlan?.price != null ? `PKR ${stats.membershipPlan.price.toLocaleString()}` : '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Min Withdrawal:</span>
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {stats?.membershipPlan?.minimumWithdrawal != null ? `PKR ${Number(stats.membershipPlan.minimumWithdrawal).toLocaleString()}` : '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Voucher:</span>
                          <span className={`font-semibold ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                            {stats?.membershipPlan?.voucherAmount != null ? `PKR ${Number(stats.membershipPlan.voucherAmount).toLocaleString()}` : '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Start Date:</span>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {stats?.membershipStartDate ? new Date(stats.membershipStartDate).toLocaleDateString() : '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ends:</span>
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {stats?.membershipEndDate ? new Date(stats.membershipEndDate).toLocaleDateString() : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Card */}
                  <div className={`rounded-2xl border p-5 ${isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/60'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Earning Structure</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Daily earning potential</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Daily Earning:</span>
                        <span className={`font-semibold text-lg ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          PKR {stats?.membershipPlan?.dailyTaskEarning || 150}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tasks Per Day:</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats?.membershipPlan?.tasksPerDay || 5}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Per Task:</span>
                        <span className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                          PKR {Math.round((stats?.membershipPlan?.dailyTaskEarning || 150) / (stats?.membershipPlan?.tasksPerDay || 5))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duration & Limits Card */}
                  <div className={`rounded-2xl border p-5 ${isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/60'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Plan Duration</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Earning period & limits</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Base Period:</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats?.membershipPlan?.maxEarningDays || 30} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Extended:</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {stats?.membershipPlan?.extendedEarningDays || 60} days
                        </span>
                      </div>
                      {(stats?.earningDaysRemaining !== undefined || true) && (
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Days Left:</span>
                          <span className={`font-semibold ${
                            (stats?.earningDaysRemaining || 45) <= 7 
                              ? 'text-red-400' 
                              : (stats?.earningDaysRemaining || 45) <= 14 
                                ? 'text-yellow-400' 
                                : isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {stats?.earningDaysRemaining || 45} days
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Shopping Voucher:</span>
                        <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          PKR {(stats?.membershipPlan?.voucherAmount || 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Plan Progress Bar */}
                {(stats?.membershipStartDate || stats?.earningEndsAt || true) && (
                  <div className="mt-8 pt-8 border-t border-gray-200/30">
                    <div className={`rounded-2xl p-6 ${isDark ? 'bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50' : 'bg-gradient-to-br from-slate-50/80 to-white/90 border border-slate-200/60'} backdrop-blur-sm shadow-lg`}>
                      {/* Header with Icon */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Plan Progress</h4>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your membership journey</p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-200 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'} backdrop-blur-sm`}>
                          <span className="font-semibold text-sm">
                            {Math.round(((stats?.activeDays || 0) / (stats?.totalEarningDays || stats?.membershipPlan?.maxEarningDays || 30)) * 100)}% Complete
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Progress Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/80 border border-gray-200/60'} backdrop-blur-sm`}>
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto mb-2">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.activeDays || 0}</p>
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Days Active</p>
                        </div>
                        <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/80 border border-gray-200/60'} backdrop-blur-sm`}>
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-2">
                            <Target className="w-4 h-4 text-white" />
                          </div>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.totalEarningDays || stats?.membershipPlan?.maxEarningDays || 30}</p>
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Days</p>
                        </div>
                        <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/80 border border-gray-200/60'} backdrop-blur-sm`}>
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 mx-auto mb-2">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.earningDaysRemaining || Math.max(0, (stats?.totalEarningDays || stats?.membershipPlan?.maxEarningDays || 30) - (stats?.activeDays || 0))}</p>
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Days Left</p>
                        </div>
                      </div>

                      {/* Enhanced Progress Bar */}
                      <div className="relative mb-4">
                        <div className={`w-full h-4 rounded-full shadow-inner ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                            style={{ 
                              width: `${Math.min(100, ((stats?.activeDays || 0) / (stats?.totalEarningDays || stats?.membershipPlan?.maxEarningDays || 30)) * 100)}%` 
                            }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-3">
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Start</span>
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Complete</span>
                        </div>
                      </div>

                      {/* Timeline */}
                      {(stats?.membershipStartDate || stats?.earningEndsAt) && (
                        <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg"></div>
                              <div>
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Started</p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {stats?.membershipStartDate ? new Date(stats.membershipStartDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  }) : 'N/A'}
                                </p>
                              </div>
                            </div>
                            {stats?.earningEndsAt && (
                              <div className="flex items-center space-x-2">
                                <div>
                                  <p className={`text-sm font-medium text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>Ends</p>
                                  <p className={`text-xs text-right ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {new Date(stats.earningEndsAt).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}
                                  </p>
                                </div>
                                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        )}

        {/* Renewal/Expiration Alert */}
        {(stats?.membershipStatus === 'EXPIRED' || (stats?.earningDaysRemaining !== undefined && stats.earningDaysRemaining <= 14)) && (
          <div className="px-4 md:px-6 mt-6">
            <div className={`rounded-3xl border p-6 backdrop-blur-sm transition-all duration-300 ${
              stats?.membershipStatus === 'EXPIRED'
                ? isDark ? 'bg-gradient-to-br from-red-900/30 via-orange-900/30 to-red-900/30 border-red-700/50' : 'bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-red-200'
                : isDark ? 'bg-gradient-to-br from-yellow-900/30 via-amber-900/30 to-yellow-900/30 border-yellow-700/50' : 'bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 border-yellow-200'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    stats?.membershipStatus === 'EXPIRED'
                      ? 'bg-red-500/20'
                      : 'bg-yellow-500/20'
                  }`}>
                    <Clock className={`w-6 h-6 ${
                      stats?.membershipStatus === 'EXPIRED'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${
                      stats?.membershipStatus === 'EXPIRED'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}>
                      {stats?.membershipStatus === 'EXPIRED' ? '🚨 Membership Expired' : '⚠️ Membership Expiring Soon'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {stats?.membershipStatus === 'EXPIRED'
                        ? 'Your membership has expired. Renew now to resume earning and maintain your benefits!'
                        : `Your membership expires in ${stats?.earningDaysRemaining} days. Renew early to keep your earning streak!`}
                    </p>
                    {stats?.membershipStatus !== 'EXPIRED' && (
                      <p className={`text-xs mt-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        💎 Loyalty discount available on renewal!
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => router.push('/membership/renew')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg whitespace-nowrap ${
                    stats?.membershipStatus === 'EXPIRED'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-red-500/30'
                      : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:shadow-yellow-500/30'
                  }`}
                >
                  {stats?.membershipStatus === 'EXPIRED' ? 'Renew Now' : 'Renew Early & Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Responsive Stats Cards */}
        {stats?.membershipStatus === 'ACTIVE' && (
          <div className="px-4 md:px-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Per Task Card */}
              <div className={`group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-105 ${isDark ? 'bg-gradient-to-br from-emerald-900/90 via-emerald-800/90 to-teal-900/90 border-emerald-700/50 shadow-emerald-900/20' : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200/60 shadow-emerald-100/50'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                      <DollarSign className="w-3 h-3 mr-1" />
                      Reward Rate
                    </div>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">₨</span>
                      </div>
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 blur animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Per Task</p>
                    <p className={`text-3xl font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>PKR {perTaskAmountVal}</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Fixed reward amount</p>
                  </div>
                </div>
              </div>

              {/* Total Earnings Card */}
              <div className={`group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-105 ${isDark ? 'bg-gradient-to-br from-violet-900/90 via-purple-900/90 to-fuchsia-900/90 border-violet-700/50 shadow-violet-900/20' : 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border-violet-200/60 shadow-violet-100/50'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-violet-800/60 text-violet-200 border border-violet-700' : 'bg-violet-100 text-violet-800 border border-violet-200'}`}>
                      <Wallet className="w-3 h-3 mr-1" />
                      Total Balance
                    </div>
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">💰</span>
                      </div>
                      <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 opacity-20 blur animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>Total Earnings</p>
                    <p className={`text-3xl font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>PKR {(stats?.totalEarnings || 0).toLocaleString()}</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>All-time earnings</p>
                  </div>
                </div>
              </div>

              {/* Tasks Progress Card */}
              <div className={`group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-105 ${isDark ? 'bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-blue-900/90 border-indigo-700/50 shadow-indigo-900/20' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 border-indigo-200/60 shadow-indigo-100/50'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-indigo-800/60 text-indigo-200 border border-indigo-700' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'}`}>
                      <Target className="w-3 h-3 mr-1" />
                      Daily Progress
                    </div>
                    <div className="relative">
                      <Suspense fallback={<div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />}>
                        <RingProgress value={completionPct} size={48} color="#6366f1" trackColor={isDark ? '#374151' : '#e5e7eb'} />
                      </Suspense>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{completionPct}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>Tasks Left Today</p>
                    <p className={`text-3xl font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{tasksLeftVal}</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Completed: {completionsVal}/{tasksPerDayVal}</p>
                  </div>
                </div>
              </div>

              {/* Earnings Chart Card */}
              <div className={`group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-105 ${isDark ? 'bg-gradient-to-br from-amber-900/90 via-orange-900/90 to-yellow-900/90 border-amber-700/50 shadow-amber-900/20' : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-amber-200/60 shadow-amber-100/50'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-amber-800/60 text-amber-200 border border-amber-700' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Today&apos;s Trend
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Earnings Today</p>
                    <p className={`text-3xl font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>PKR {stats.dailyEarningsToday || (completionsVal * perTaskAmountVal)}</p>
                  </div>
                  <div className="mt-4 -mx-2">
                    <Suspense fallback={<div className="h-10 bg-gray-200 rounded animate-pulse" />}>
                      <Sparkline data={earningsTrend} width={280} height={40} stroke={isDark ? '#f59e0b' : '#d97706'} />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Today's Tasks Section */}
        <div className="px-4 md:px-6 mt-8">
          <div className={`rounded-3xl border backdrop-blur-sm transition-all duration-300 ${isDark ? 'bg-gray-800/90 border-gray-700/50 shadow-gray-900/20' : 'bg-white/90 border-gray-200/60 shadow-gray-100/50'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Today&apos;s Tasks</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quick access to available tasks</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => router.push('/tasks')} className={`transition-all duration-200 hover:scale-105 ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
              
              {todayTasks.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-sm font-medium mb-1">No tasks available</p>
                  <p className="text-xs">Check back later for new opportunities</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {todayTasks.map((t: any, index: number) => (
                    <div key={t.id} className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${isDark ? 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 border-gray-700 hover:border-gray-600' : 'bg-gradient-to-r from-white to-gray-50/50 border-gray-200 hover:border-gray-300'}`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${index % 3 === 0 ? 'from-blue-500 to-indigo-600' : index % 3 === 1 ? 'from-emerald-500 to-teal-600' : 'from-purple-500 to-pink-600'} shadow-lg flex items-center justify-center`}>
                                <span className="text-white font-bold text-xs">{index + 1}</span>
                              </div>
                              <h4 className={`text-sm font-semibold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h4>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                <DollarSign className="w-3 h-3 mr-1" />
                                PKR {Math.round(t.reward)}
                              </div>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/50 text-blue-200 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                <Activity className="w-3 h-3 mr-1" />
                                {t.type.replace(/_/g,' ')}
                              </div>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                <Package className="w-3 h-3 mr-1" />
                                {t.category}
                              </div>
                            </div>
                            
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              t.isCompleted ? (isDark ? 'bg-green-900/50 text-green-200 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200') :
                              t.isInProgress ? (isDark ? 'bg-indigo-900/50 text-indigo-200 border border-indigo-800' : 'bg-indigo-50 text-indigo-700 border border-indigo-200') :
                              t.canStart ? (isDark ? 'bg-purple-900/50 text-purple-200 border border-purple-800' : 'bg-purple-50 text-purple-700 border border-purple-200') :
                              (isDark ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-500 border border-gray-200')
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                t.isCompleted ? 'bg-green-400' :
                                t.isInProgress ? 'bg-indigo-400' :
                                t.canStart ? 'bg-purple-400' : 'bg-gray-400'
                              }`} />
                              {t.isCompleted ? 'Completed' : t.isInProgress ? 'In Progress' : t.canStart ? 'Available' : 'Locked'}
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <Button 
                              size="sm" 
                              onClick={() => router.push('/tasks')} 
                              className={`transition-all duration-200 hover:scale-105 shadow-lg ${
                                t.canStart || t.isInProgress 
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' 
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {t.isCompleted ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <ArrowRight className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className={`shadow-sm border-b sticky top-0 z-40 md:hidden transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="px-4 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>MCNmart</h1>
                  <p className={`text-xs transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* Mobile Messages */}
                <div className="relative" ref={messageRef}>
                  <TouchButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMessages(!showMessages)}
                    className={`relative p-2 transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    {messageCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-blue-500 text-white">
                        {messageCount}
                      </Badge>
                    )}
                  </TouchButton>
                
                  {showMessages && (
                    <div className={`absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg shadow-xl border z-50 max-h-80 overflow-y-auto transition-colors duration-300 ${
                      isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      <div className={`p-3 border-b transition-colors ${
                        isDark ? 'border-gray-600' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold text-sm transition-colors ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>Messages</h3>
                          <TouchButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMessages(false)}
                            className={`p-1 transition-colors ${
                              isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <X className="h-3 w-3" />
                          </TouchButton>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        <div className={`p-3 cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}>
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-green-600 text-white text-xs">A</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium transition-colors ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>Admin Support</p>
                              <p className={`text-xs mt-1 transition-colors line-clamp-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>Welcome to MCNmart! How can we help you today?</p>
                              <p className={`text-xs mt-1 transition-colors ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>2 hours ago</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                          </div>
                        </div>
                        <div className={`p-3 cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}>
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback className="bg-blue-600 text-white text-xs">T</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium transition-colors ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>Team Leader</p>
                              <p className={`text-xs mt-1 transition-colors line-clamp-2 ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>Great work on your recent sales! Keep it up.</p>
                              <p className={`text-xs mt-1 transition-colors ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>1 day ago</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                          </div>
                        </div>
                        <div className="p-3 text-center">
                          <TouchButton variant="outline" size="sm" className="w-full text-xs">
                            View All Messages
                          </TouchButton>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Mobile Notifications */}
                <div className="relative" ref={notificationRef}>
                  <TouchButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell h-4 w-4">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                    </svg>
                    {notificationCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                        {notificationCount}
                      </Badge>
                    )}
                  </TouchButton>
                
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-72 rounded-lg shadow-xl border z-50 max-h-80 overflow-y-auto transition-colors duration-300 ${
                    isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`p-3 border-b transition-colors ${
                      isDark ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <h3 className={`font-semibold text-sm transition-colors ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Notifications</h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-600">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 cursor-pointer transition-colors ${
                            isDark 
                              ? `hover:bg-gray-700 ${!notification.read ? 'bg-green-900/20' : ''}` 
                              : `hover:bg-gray-50 ${!notification.read ? 'bg-green-50' : ''}`
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-2">
                            <div className={`w-2 h-2 rounded-full mt-1 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'money' ? 'bg-yellow-500' :
                              notification.type === 'warning' ? 'bg-red-500' :
                              notification.type === 'event' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`} />
                            <div className="flex-1">
                              <p className={`text-xs font-medium transition-colors ${
                                isDark ? 'text-white' : 'text-gray-900'
                              }`}>{String(notification.title ?? '')}</p>
                              <p className={`text-xs mt-1 transition-colors ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>{String(notification.message ?? '')}</p>
                              <p className={`text-xs mt-1 transition-colors ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile User Profile Menu - Radix Dropdown */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <TouchButton
                    variant="ghost"
                    size="sm"
                    aria-label="Open profile menu"
                    className={`flex items-center space-x-1 p-1 transition-colors ${
                      isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.image || session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                      <AvatarFallback className="bg-green-600 text-white text-xs">
                        {session?.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3" />
                  </TouchButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    side="bottom"
                    sideOffset={8}
                    align="end"
                    collisionPadding={8}
                    className={`right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg shadow-xl border z-50 transition-colors duration-300 ${
                      isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`p-4 border-b transition-colors ${
                      isDark ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.image || session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                          <AvatarFallback className="bg-green-600 text-white text-sm">
                            {session?.user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm transition-colors truncate ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>{String(session?.user?.name || 'User')}</p>
                          <p className={`text-xs transition-colors truncate ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>{String(session?.user?.email || '')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <DropdownMenu.Item
                        onSelect={() => router.push('/profile')}
                        className={`flex items-center w-full px-4 py-2 text-sm outline-none cursor-pointer ${
                          isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <User className="h-4 w-4 mr-3" />
                        <span>View Profile</span>
                      </DropdownMenu.Item>

                      <DropdownMenu.Item
                        onSelect={() => router.push('/settings')}
                        className={`flex items-center w-full px-4 py-2 text-sm outline-none cursor-pointer ${
                          isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        <span>Account Settings</span>
                      </DropdownMenu.Item>

                      <DropdownMenu.Item
                        onSelect={() => router.push('/favorites')}
                        className={`flex items-center w-full px-4 py-2 text-sm outline-none cursor-pointer ${
                          isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Heart className="h-4 w-4 mr-3" />
                        <span>Favorites</span>
                      </DropdownMenu.Item>

                      <div className={`border-t my-2 transition-colors ${
                        isDark ? 'border-gray-600' : 'border-gray-200'
                      }`} />

                      <DropdownMenu.Item
                        onSelect={() => signOut({ callbackUrl: '/auth/login' })}
                        className={`flex items-center w-full px-4 py-2 text-sm outline-none cursor-pointer text-red-600 ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-red-50'
                        }`}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        <span>Sign Out</span>
                      </DropdownMenu.Item>
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>
      </div>

        {/* Mobile Welcome Section */}
        <MobileSection title={`Welcome, ${session?.user?.name?.split(' ')[0] || 'User'}!`}>
          <MobileCard className={`transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600' 
              : 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-gray-200'
          }`}>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className={`text-xl font-bold transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard Overview</h2>
                  <p className={`text-sm transition-colors ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Track your MCNmart progress and earnings</p>
                </div>
              </div>
              
              {/* Hide activation message when payment is accepted or membership is active */}
              {stats?.membershipStatus !== 'ACTIVE' && !(paymentBanner && (paymentBanner.status === 'PENDING' || paymentBanner.status === 'ACCEPTED')) && (
                <div className={`rounded-xl p-4 mt-4 border-l-4 border-orange-500 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-400' 
                    : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-500'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold mb-1 ${
                        isDark ? 'text-orange-300' : 'text-orange-800'
                      }`}>Account Activation Required</p>
                      <p className={`text-sm mb-3 ${
                        isDark ? 'text-orange-200' : 'text-orange-700'
                      }`}>
                        {`Invest PKR ${(stats?.membershipPlan?.price ?? 1000).toLocaleString()} to start earning commissions and unlock all features`}
                      </p>
                      <TouchButton 
                        size="sm" 
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition-all duration-200"
                        onClick={() => router.push('/membership')}
                      >
                        🚀 Activate Now
                      </TouchButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </MobileCard>
        </MobileSection>

        {/* Membership Plan Section - Optimized */}
        {stats?.membershipStatus === 'ACTIVE' && stats?.membershipPlan && (
          <MobileSection title="Your Membership Plan" subtitle="Current plan and earnings">
            <MobileCard className={isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'}>
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {stats.membershipPlan.displayName}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                        Rs.{stats.membershipPlan.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${(stats?.eligible ?? true) ? 'bg-emerald-600' : 'bg-gray-400'} text-white text-xs`}>
                    {(stats?.eligible ?? true) ? 'Active' : 'Locked'}
                  </Badge>
                </div>

                {/* Key Stats - 3 columns */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-800/40' : 'bg-white'}`}>
                    <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Per Task</p>
                    <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rs.{Math.round(perTaskAmountVal)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-800/40' : 'bg-white'}`}>
                    <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Daily</p>
                    <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rs.{Math.round(perTaskAmountVal * tasksPerDayVal)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-800/40' : 'bg-white'}`}>
                    <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Tasks</p>
                    <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {tasksPerDayVal}/day
                    </p>
                  </div>
                </div>

                {/* Progress Stats - 2 columns */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-800/40' : 'bg-white'}`}>
                    <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Days Active</p>
                    <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stats?.activeDays ?? 0}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-800/40' : 'bg-white'}`}>
                    <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Days Left</p>
                    <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stats.earningDaysRemaining || 0}
                    </p>
                  </div>
                </div>

                {/* Benefits - 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/40' : 'bg-green-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'}`}>Voucher</p>
                    <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rs.{stats.membershipPlan.voucherAmount?.toLocaleString() ?? 0}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/40' : 'bg-green-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-green-300' : 'text-green-700'}`}>Today</p>
                    <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rs.{stats.dailyEarningsToday || (completionsVal * perTaskAmountVal)}
                    </p>
                  </div>
                </div>
              </div>
            </MobileCard>
          </MobileSection>
        )}
        {/* Mobile Referral Section */}
        <MobileSection title="Share & Earn">
          <MobileCard className={`${isDark ? 'bg-gradient-to-br from-emerald-900/20 via-teal-900/20 to-green-900/20 border-emerald-700/30' : 'bg-gradient-to-br from-emerald-50/80 via-teal-50/80 to-green-50/80 border-emerald-200/60'} backdrop-blur-sm shadow-lg`}>
            <div className="p-6">
              {/* Enhanced Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold transition-colors ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Referral Program</h3>
                    <p className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Invite friends and earn rewards</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-800' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                  {stats?.totalReferrals || 0} Referrals
                </div>
              </div>

              {/* Enhanced Referral Code Display */}
              <div className={`rounded-2xl p-5 mb-6 ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/90 border border-gray-200/60'} backdrop-blur-sm shadow-inner`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Your Referral Code</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Share this code with friends</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-gray-900/60 border border-gray-700' : 'bg-gray-50/80 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">#{stats?.referralCode?.slice(-2) || '00'}</span>
                    </div>
                    <div>
                      <span className={`font-mono text-2xl font-bold tracking-wider transition-colors ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>{stats?.referralCode || 'LOADING'}</span>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unique referral identifier</p>
                    </div>
                  </div>
                  
                  <TouchButton
                    variant="outline"
                    size="sm"
                    onClick={copyReferralCode}
                    className={`${copySuccess ? 'bg-green-500 text-white border-green-500 animate-pulse' : 'text-emerald-600 border-emerald-300 hover:bg-emerald-50'} transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 transform`}
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="ml-2 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="ml-2 font-semibold">Copy</span>
                      </>
                    )}
                  </TouchButton>
                </div>
              </div>

              {/* Referral Stats - cleaned and responsive */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/80 border border-gray-200/60'} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg transform`}>
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-2">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.totalReferrals || 0}</p>
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Network</p>
                </div>
                <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-white/80 border border-gray-200/60'} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg transform`}>
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 mx-auto mb-2">
                    <UserCheck className="w-4 h-4 text-white" />
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.directReferrals || 0}</p>
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Direct Referrals</p>
                </div>
              </div>

              {/* Referral Benefits */}
              <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-800/50' : 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60'} backdrop-blur-sm`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Award className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Referral Benefits</h4>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}></div>
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Earn commission on referral investments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Multi-level commission structure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-purple-400' : 'bg-purple-500'}`}></div>
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Help friends start their earning journey</span>
                  </div>
                </div>
              </div>
            </div>
          </MobileCard>
        </MobileSection>



        {/* Mobile Investment CTA - Hide when payment is accepted or membership is active */}
        {stats?.membershipStatus !== 'ACTIVE' && !(paymentBanner && (paymentBanner.status === 'PENDING' || paymentBanner.status === 'ACCEPTED')) && (
          <MobileSection title="Account Activation">
            <MobileCard className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <div className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h3 className={`text-lg font-bold mb-2 transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                } !important`}>Activate Your Account</h3>
                <p className={`text-sm mb-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  {`Invest PKR ${(stats?.membershipPlan?.price ?? 1000).toLocaleString()} to unlock all features and start earning commissions.`}
                </p>
                <TouchButton
                  onClick={() => router.push('/membership')}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold"
                >
                  {`Activate Now - PKR ${(stats?.membershipPlan?.price ?? 1000).toLocaleString()}`}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </TouchButton>
              </div>
            </MobileCard>
          </MobileSection>
        )}
      </MobilePageContainer>
    </MobileLayout>
  );
}

// Loading fallback component for Suspense
function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Error boundary component
function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">Something went wrong while loading your dashboard.</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setHasError(false);
                window.location.reload();
              }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Main dashboard component with Suspense boundary for useSearchParams
export default function Dashboard() {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </DashboardErrorBoundary>
  );
}
