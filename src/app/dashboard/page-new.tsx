'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  ArrowRight,
  User,
  X,
  Info,
  Calendar,
  Home,
  Target,
  ShoppingBag,
  FileText,
  Settings,
  Menu,
  ChevronRight,
  Star,
  Zap,
  Award,
  DollarSign,
  Eye,
  EyeOff,
  Bell,
  LogOut
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';

interface UserStats {
  totalEarnings: number;
  voucherBalance: number;
  totalReferrals: number;
  directReferrals: number;
  hasInvested: boolean;
  isActive: boolean;
  referralCode: string;
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

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Welcome to MCNmart!',
      message: 'Your dashboard is ready. Complete your investment to start earning.',
      time: '2 minutes ago',
      type: 'info',
      read: false
    },
    {
      id: 2,
      title: 'Referral Code Ready',
      message: 'Your unique referral code has been generated. Start sharing to earn!',
      time: '5 minutes ago',
      type: 'success',
      read: false
    },
    {
      id: 3,
      title: 'Investment Reminder',
      message: 'Complete your PKR 1,000 investment to activate your account.',
      time: '1 hour ago',
      type: 'warning',
      read: false
    }
  ]);
  
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchUserStats();
    }
  }, [status, router]);

  // Update notification count
  useEffect(() => {
    const unreadCount = notifications.filter(notif => !notif.read).length;
    setNotificationCount(unreadCount);
  }, [notifications]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch user stats');
        // Set demo data for development
        setStats({
          totalEarnings: 2500,
          voucherBalance: 500,
          totalReferrals: 12,
          directReferrals: 5,
          hasInvested: false,
          isActive: true,
          referralCode: 'MCN' + Math.random().toString(36).substr(2, 6).toUpperCase(),
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
      // Set demo data for development
      setStats({
        totalEarnings: 2500,
        voucherBalance: 500,
        totalReferrals: 12,
        directReferrals: 5,
        hasInvested: false,
        isActive: true,
        referralCode: 'MCN' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        commissionBreakdown: {
          level1: 1000,
          level2: 750,
          level3: 500,
          level4: 200,
          level5: 50
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (stats?.referralCode) {
      try {
        await navigator.clipboard.writeText(stats.referralCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy referral code:', err);
      }
    }
  };

  const shareReferralLink = async () => {
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
        alert('Referral link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy referral link:', err);
      }
    }
  };

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white/80">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/80">Failed to load dashboard data</p>
          <Button onClick={fetchUserStats} className="mt-4 bg-purple-600 hover:bg-purple-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile App Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">MCNmart</h1>
                <p className="text-xs text-white/60">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-white hover:bg-white/10"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-xs text-white font-medium">{notificationCount}</span>
                    </div>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-xl shadow-2xl border border-white/10 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="font-semibold text-white">Notifications</h3>
                    </div>
                    <div className="divide-y divide-white/10">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-white/5 cursor-pointer ${
                            !notification.read ? 'bg-purple-500/10' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-400' :
                              notification.type === 'money' ? 'bg-yellow-400' :
                              notification.type === 'warning' ? 'bg-red-400' :
                              notification.type === 'event' ? 'bg-purple-400' :
                              'bg-blue-400'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{notification.title}</p>
                              <p className="text-sm text-white/70">{notification.message}</p>
                              <p className="text-xs text-white/50 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <Avatar className="h-8 w-8 ring-2 ring-purple-400/50">
                <AvatarImage src="" alt={session?.user?.name || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {session?.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Welcome back!</h2>
              <p className="text-white/70">{session?.user?.name}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
          
          {!stats.hasInvested && (
            <div className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="text-white font-medium">Account Activation Required</p>
                  <p className="text-white/70 text-sm">Invest PKR 1,000 to start earning</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Earnings */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/30 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 text-white/60 hover:text-white hover:bg-white/10"
              >
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium">Total Earnings</p>
              <p className="text-white text-lg font-bold">
                {showBalance ? `PKR ${stats.totalEarnings.toLocaleString()}` : '••••••'}
              </p>
            </div>
          </div>

          {/* Voucher Balance */}
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                <Gift className="h-4 w-4 text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium">Voucher Balance</p>
              <p className="text-white text-lg font-bold">PKR {stats.voucherBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold mb-4">Network Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
              <p className="text-white/60 text-sm">Total Network</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pink-500/30 flex items-center justify-center mx-auto mb-2">
                <Star className="h-6 w-6 text-pink-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.directReferrals}</p>
              <p className="text-white/60 text-sm">Direct Referrals</p>
            </div>
          </div>
        </div>

        {/* Referral Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold mb-4">Share & Earn</h3>
          <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
            <p className="text-white/70 text-sm mb-2">Your Referral Code</p>
            <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
              <span className="text-white font-mono text-lg">{stats.referralCode}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyReferralCode}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
              >
                {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button
            onClick={shareReferralLink}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Referral Link
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => router.push('/tasks')}
            className="h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 hover:bg-orange-500/30 text-white flex-col space-y-1"
            variant="ghost"
          >
            <Target className="h-6 w-6" />
            <span className="text-sm">Tasks</span>
          </Button>
          
          <Button
            onClick={() => router.push('/products')}
            className="h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 hover:bg-blue-500/30 text-white flex-col space-y-1"
            variant="ghost"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="text-sm">Shop</span>
          </Button>
        </div>

        {/* Investment CTA */}
        {!stats.hasInvested && (
          <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-lg rounded-2xl border border-orange-400/30 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Activate Your Account</h3>
            <p className="text-white/80 mb-6">Invest PKR 1,000 to unlock all features and start earning commissions</p>
            <Button
              onClick={() => router.push('/membership')}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 text-lg font-semibold"
            >
              Activate Now - PKR 1,000
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-lg border-t border-white/10">
        <div className="grid grid-cols-5 py-2">
          <Button
            variant="ghost"
            className="flex-col space-y-1 text-white hover:bg-white/10 h-16"
            onClick={() => router.push('/dashboard')}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex-col space-y-1 text-white/60 hover:bg-white/10 h-16"
            onClick={() => router.push('/tasks')}
          >
            <Target className="h-5 w-5" />
            <span className="text-xs">Tasks</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex-col space-y-1 text-white/60 hover:bg-white/10 h-16"
            onClick={() => router.push('/wallet')}
          >
            <Wallet className="h-5 w-5" />
            <span className="text-xs">Wallet</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex-col space-y-1 text-white/60 hover:bg-white/10 h-16"
            onClick={() => router.push('/products')}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-xs">Shop</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex-col space-y-1 text-white/60 hover:bg-white/10 h-16"
            onClick={() => signOut()}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </div>

      {/* Bottom Padding for Fixed Navigation */}
      <div className="h-20"></div>
    </div>
  );
}
