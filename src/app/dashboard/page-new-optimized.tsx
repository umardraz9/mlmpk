'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useCallback, lazy } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useOptimizedFetch } from '@/hooks/useOptimizedFetch';
import { usePerformanceMonitor } from '@/utils/performanceMonitor';
import type { UserStats } from '@/components/dashboard/DashboardInterfaces';

// Lazy load heavy components
const DashboardStats = lazy(() => import('@/components/dashboard/DashboardStats'));
const DashboardCharts = lazy(() => import('@/components/dashboard/DashboardCharts').then(mod => ({ default: mod.Sparkline })));
const TeamSection = lazy(() => import('@/components/dashboard/TeamSection'));
const ActivitySection = lazy(() => import('@/components/dashboard/ActivitySection'));
const QuickActions = lazy(() => import('@/components/dashboard/QuickActions'));

// Loading component
const SectionLoader = () => (
  <div className="animate-pulse">
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">
            Failed to load this section. Please refresh the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDark } = useTheme();
  
  // Use optimized fetch hook with caching
  const { 
    data: stats, 
    loading, 
    error, 
    refetch 
  } = useOptimizedFetch<UserStats>(
    session ? '/api/user/stats' : null,
    {
      cacheTime: 60000, // 1 minute cache
      refetchInterval: 300000, // Refetch every 5 minutes
      onError: (err) => console.error('Failed to fetch stats:', err)
    }
  );

  // Performance monitoring
  usePerformanceMonitor('dashboard');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Dashboard
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome back, {session?.user?.name || 'User'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            aria-label="Refresh dashboard"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats Section */}
        <ErrorBoundary>
          <Suspense fallback={<SectionLoader />}>
            <DashboardStats stats={stats} />
          </Suspense>
        </ErrorBoundary>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <Suspense fallback={<SectionLoader />}>
              <DashboardCharts stats={stats} />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Quick Actions */}
        <ErrorBoundary>
          <Suspense fallback={<SectionLoader />}>
            <QuickActions isDark={isDark} />
          </Suspense>
        </ErrorBoundary>

        {/* Team & Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <Suspense fallback={<SectionLoader />}>
              <TeamSection userId={(session?.user as any)?.id} />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary>
            <Suspense fallback={<SectionLoader />}>
              <ActivitySection userId={(session?.user as any)?.id} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// Main dashboard component with Suspense boundary
export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
