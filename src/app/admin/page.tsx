'use client';

import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  CheckSquare,
  TrendingUp,
  BarChart3,
  Package,
  Settings,
  CreditCard,
  Bell,
  Activity,
  RefreshCcw,
  FileText,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Network,
  Banknote,
  Shield,
  Zap,
  Target,
  Server,
  Menu,
  Sparkles,
  Crown,
  Star,
  Gem,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

// Premium Stat Card Component with Glassmorphism
const StatCard = memo(({ title, value, icon: Icon, color, change, onClick, description }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change?: { type: 'up' | 'down'; value: string };
  onClick?: () => void;
  description?: string;
}) => {
  const { isDark } = useTheme();
  
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/10',
      icon: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      text: 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent',
      border: 'border-blue-200/20 dark:border-blue-400/20'
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-500/10 via-green-400/5 to-teal-500/10 dark:from-emerald-400/20 dark:to-teal-400/10',
      icon: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      text: 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent',
      border: 'border-emerald-200/20 dark:border-emerald-400/20'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/10',
      icon: 'bg-gradient-to-br from-purple-500 to-pink-500',
      text: 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent',
      border: 'border-purple-200/20 dark:border-purple-400/20'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-red-500/10 dark:from-orange-400/20 dark:to-red-400/10',
      icon: 'bg-gradient-to-br from-orange-500 to-red-500',
      text: 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent',
      border: 'border-orange-200/20 dark:border-orange-400/20'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-500/10 via-red-400/5 to-pink-500/10 dark:from-red-400/20 dark:to-pink-400/10',
      icon: 'bg-gradient-to-br from-red-500 to-pink-500',
      text: 'bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent',
      border: 'border-red-200/20 dark:border-red-400/20'
    }
  };

  const styles = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.3 }}
    >
      <Card 
        className={`${styles.bg} backdrop-blur-sm border ${styles.border} hover:shadow-xl transition-all duration-300 relative overflow-hidden group ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={onClick}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent group-hover:from-white/10 transition-colors duration-300"></div>
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`inline-flex items-center justify-center w-12 h-12 ${styles.icon} rounded-xl shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {title}
                  </p>
                  {description && (
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {description}
                    </p>
                  )}
                </div>
              </div>
              <p className={`text-3xl font-bold ${styles.text}`}>
                {value}
              </p>
            </div>
            {change && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  change.type === 'up' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {change.type === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {change.value}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

// Premium Quick Action Card Component with Glassmorphism
const QuickActionCard = memo(({ title, description, icon: Icon, href, badge, color = 'blue' }: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  color?: string;
}) => {
  const router = useRouter();
  const { isDark } = useTheme();

  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/10',
      icon: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      border: 'border-blue-200/20 dark:border-blue-400/20'
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-500/10 via-green-400/5 to-teal-500/10 dark:from-emerald-400/20 dark:to-teal-400/10',
      icon: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      border: 'border-emerald-200/20 dark:border-emerald-400/20'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/10',
      icon: 'bg-gradient-to-br from-purple-500 to-pink-500',
      border: 'border-purple-200/20 dark:border-purple-400/20'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-red-500/10 dark:from-orange-400/20 dark:to-red-400/10',
      icon: 'bg-gradient-to-br from-orange-500 to-red-500',
      border: 'border-orange-200/20 dark:border-orange-400/20'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-500/10 via-red-400/5 to-pink-500/10 dark:from-red-400/20 dark:to-pink-400/10',
      icon: 'bg-gradient-to-br from-red-500 to-pink-500',
      border: 'border-red-200/20 dark:border-red-400/20'
    }
  };

  const styles = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.3 }}
    >
      <Card 
        className={`${styles.bg} border ${styles.border} rounded-3xl sm:rounded-[28px] backdrop-blur-sm sm:backdrop-blur-lg shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden group`}
        onClick={() => router.push(href)}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
        <div className="absolute -top-24 -right-20 w-56 h-56 bg-white/20 dark:bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-all duration-500"></div>
        
        <CardContent className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className={`absolute inset-0 ${styles.icon} rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
              <div className={`relative ${styles.icon} w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg`}> 
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {title}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {description}
                </p>
              </div>
              {badge && (
                <Badge className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-[11px] sm:text-xs px-2.5 py-1 rounded-full shadow-sm">
                  {badge}
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-gray-500' : 'text-gray-500/80'} sm:text-sm sm:normal-case sm:tracking-normal sm:font-medium sm:${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
              <span className="sm:hidden">Tap to open</span>
              <span className="hidden sm:inline">Open section</span>
            </span>
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 dark:bg-gray-800/80 text-emerald-600 dark:text-emerald-300 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white dark:group-hover:bg-gray-700">
              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

QuickActionCard.displayName = 'QuickActionCard';

export default function ModernAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDark } = useTheme();
  const [showSidebar, setShowSidebar] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalCommissions: 0,
    activeTasks: 0,
    pendingWithdrawals: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    interface UserSession extends Session {
      user: {
        isAdmin?: boolean;
      } & Session['user'];
    }
    if (!session || !(session as UserSession).user?.isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchAdminStats();
  }, [session, status, router, fetchAdminStats]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAdminStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [fetchAdminStats]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%)]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-full -translate-y-48 translate-x-48 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-pink-500/5 rounded-full translate-y-48 -translate-x-48 blur-3xl"></div>
      
      {/* Premium Header with Glassmorphism */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 backdrop-blur-xl border-b ${
          isDark 
            ? 'bg-gray-900/80 border-gray-700/50' 
            : 'bg-white/80 border-gray-200/50'
        }`}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="px-6 py-5 flex items-center justify-between relative">
          {/* Floating Sparkles */}
          <div className="absolute top-2 left-8">
            <Sparkles className="w-4 h-4 text-emerald-400 opacity-60" />
          </div>
          <div className="absolute bottom-2 right-12">
            <Star className="w-3 h-3 text-purple-400 opacity-40" />
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover:bg-white/10 dark:hover:bg-gray-800/50"
              onClick={() => setShowSidebar(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Premium Logo & Title */}
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg"
              >
                <Gem className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent`}>
                  Admin Dashboard
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Welcome back, <span className="font-medium">{session?.user?.name}</span>
                  <Crown className="inline w-4 h-4 ml-1 text-yellow-500" />
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hover:bg-white/10 dark:hover:bg-gray-800/50 backdrop-blur-sm"
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="ml-2 hidden sm:inline">Refresh</span>
              </Button>
            </motion.div>
            <ThemeToggle />
          </div>
        </div>
      </motion.div>

      {/* Main Content with Premium Spacing */}
      <div className="relative p-6 space-y-8">
        {/* Premium Stats Grid */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            color="blue"
            change={{ type: 'up', value: '+12%' }}
            onClick={() => router.push('/admin/users')}
            description="Active platform users"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            color="green"
            change={{ type: 'up', value: '+8%' }}
            description="Total platform revenue"
          />
          <StatCard
            title="Orders"
            value={stats.totalOrders}
            icon={Package}
            color="purple"
            change={{ type: 'up', value: `${stats.pendingOrders} pending` }}
            onClick={() => router.push('/admin/orders')}
            description="Order management"
          />
          <StatCard
            title="Withdrawals"
            value={stats.pendingWithdrawals}
            icon={TrendingUp}
            color="orange"
            onClick={() => router.push('/admin/withdrawals')}
            description="Pending withdrawals"
          />
        </motion.div>

        {/* Premium Quick Actions Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}>
                  Quick Actions
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Streamline daily workflows with curated admin shortcuts.
                </p>
              </div>
            </div>
            <Button 
              className="group relative overflow-hidden rounded-full px-4 sm:px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-600 hover:via-teal-600 hover:to-sky-600 shadow-lg"
            >
              <span className="relative flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Quick Action Hub
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <QuickActionCard
              title="Manage Users"
              description="View and manage user accounts"
              icon={Users}
              href="/admin/users"
              color="blue"
              badge={`${stats.activeUsers} active`}
            />
            <QuickActionCard
              title="Process Orders"
              description="Review and process orders"
              icon={Package}
              href="/admin/orders"
              color="purple"
              badge={`${stats.pendingOrders} pending`}
            />
            <QuickActionCard
              title="Payment Settings"
              description="Configure payment methods"
              icon={CreditCard}
              href="/admin/payment-settings"
              color="green"
            />
            <QuickActionCard
              title="View Analytics"
              description="Detailed reports and insights"
              icon={BarChart3}
              href="/admin/analytics"
              color="orange"
            />
            <QuickActionCard
              title="Manage Products"
              description="Product catalog management"
              icon={ShoppingCart}
              href="/admin/products"
              color="blue"
            />
            <QuickActionCard
              title="MLM Network"
              description="View referral network"
              icon={Network}
              href="/admin/mlm-network"
              color="purple"
            />
            <QuickActionCard
              title="Withdrawals"
              description="Process withdrawal requests"
              icon={Banknote}
              href="/admin/withdrawals"
              color="red"
              badge={`${stats.pendingWithdrawals} pending`}
            />
            <QuickActionCard
              title="Task Management"
              description="Monitor task completion"
              icon={CheckSquare}
              href="/admin/tasks"
              color="green"
              badge={`${stats.activeTasks} active`}
            />
            <QuickActionCard
              title="Blog Management"
              description="Create and manage blog posts"
              icon={FileText}
              href="/admin/blog"
              color="orange"
            />
            <QuickActionCard
              title="System Settings"
              description="Configure platform settings"
              icon={Settings}
              href="/admin/settings"
              color="blue"
            />
            <QuickActionCard
              title="Security"
              description="Security settings and monitoring"
              icon={Shield}
              href="/admin/security"
              color="red"
            />
            <QuickActionCard
              title="Notifications"
              description="System-wide announcements"
              icon={Bell}
              href="/admin/notifications"
              color="purple"
            />
          </div>
        </motion.div>

        {/* Premium System Status */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className={`backdrop-blur-sm border ${isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'} relative overflow-hidden`}>
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                    <Server className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    System Status
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-3 h-3 bg-green-500 rounded-full shadow-lg"
                  ></motion.div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">All systems operational</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/10 backdrop-blur-sm border border-blue-200/20 dark:border-blue-400/20"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-3 shadow-lg">
                    <Server className="h-6 w-6 text-white" />
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    API Status
                  </p>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs px-3 py-1">
                    Online
                  </Badge>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/10 backdrop-blur-sm border border-purple-200/20 dark:border-purple-400/20"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-3 shadow-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Active Users
                  </p>
                  <p className={`text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}>
                    {stats.activeUsers}
                  </p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-400/20 dark:to-red-400/10 backdrop-blur-sm border border-orange-200/20 dark:border-orange-400/20"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl mb-3 shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Performance
                  </p>
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs px-3 py-1">
                    Optimal
                  </Badge>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-400/20 dark:to-teal-400/10 backdrop-blur-sm border border-emerald-200/20 dark:border-emerald-400/20"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl mb-3 shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    Speed
                  </p>
                  <p className={`text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent`}>
                    Fast
                  </p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Premium Mobile Sidebar Overlay */}
      {showSidebar && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div 
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-purple-900/20 to-black/70 backdrop-blur-md" 
            onClick={() => setShowSidebar(false)} 
          />
          <motion.div 
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            className={`fixed left-0 top-0 bottom-0 w-80 ${
              isDark ? 'bg-gray-900/95' : 'bg-white/95'
            } backdrop-blur-xl shadow-2xl border-r border-white/10 dark:border-gray-700/30`}
          >
            {/* Premium Header */}
            <div className="p-6 border-b border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg"
                  >
                    <Gem className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className={`font-bold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent`}>
                      Admin Panel
                    </h2>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Management Dashboard
                    </p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(false)}
                    className="hover:bg-white/10 dark:hover:bg-gray-800/50 rounded-full"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
            
            {/* Premium Navigation */}
            <div className="p-4 space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto">
              {[
                { icon: Users, label: 'Users', href: '/admin/users', color: 'blue' },
                { icon: Package, label: 'Orders', href: '/admin/orders', color: 'purple' },
                { icon: CreditCard, label: 'Payments', href: '/admin/payments', color: 'green' },
                { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', color: 'orange' },
                { icon: ShoppingCart, label: 'Products', href: '/admin/products', color: 'blue' },
                { icon: Network, label: 'MLM Network', href: '/admin/mlm-network', color: 'purple' },
                { icon: Banknote, label: 'Withdrawals', href: '/admin/withdrawals', color: 'red' },
                { icon: CheckSquare, label: 'Tasks', href: '/admin/tasks', color: 'green' },
                { icon: FileText, label: 'Blog', href: '/admin/blog', color: 'orange' },
                { icon: Settings, label: 'Settings', href: '/admin/settings', color: 'blue' },
                { icon: Shield, label: 'Security', href: '/admin/security', color: 'red' },
                { icon: Bell, label: 'Notifications', href: '/admin/notifications', color: 'purple' },
              ].map((item, index) => {
                const Icon = item.icon;
                const colorClasses = {
                  blue: 'hover:bg-blue-500/10 hover:border-blue-500/20',
                  green: 'hover:bg-emerald-500/10 hover:border-emerald-500/20',
                  purple: 'hover:bg-purple-500/10 hover:border-purple-500/20',
                  orange: 'hover:bg-orange-500/10 hover:border-orange-500/20',
                  red: 'hover:bg-red-500/10 hover:border-red-500/20'
                };
                
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start p-3 rounded-xl border border-transparent transition-all duration-200 ${colorClasses[item.color as keyof typeof colorClasses]}`}
                      onClick={() => {
                        router.push(item.href);
                        setShowSidebar(false);
                      }}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
