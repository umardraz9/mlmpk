'use client';

import { lazy, Suspense, memo, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { CardSkeleton, ChartSkeleton, ListSkeleton } from '@/components/LazyWrapper';

// Lazy load heavy components
const StatCards = dynamic(() => import('@/components/admin/StatCards'), {
  loading: () => <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>,
  ssr: false
});

const RecentOrdersWidget = dynamic(() => import('@/components/admin/RecentOrdersWidget'), {
  loading: () => <ListSkeleton count={5} />,
  ssr: false
});

const PendingPaymentsWidget = dynamic(() => import('@/components/admin/PendingPaymentsWidget'), {
  loading: () => <ListSkeleton count={5} />,
  ssr: false
});

const ActivityFeed = dynamic(() => import('@/components/admin/ActivityFeed'), {
  loading: () => <ListSkeleton count={4} />,
  ssr: false
});

const SystemHealthWidget = dynamic(() => import('@/components/admin/SystemHealthWidget'), {
  loading: () => <CardSkeleton />,
  ssr: false
});

const QuickActionsGrid = dynamic(() => import('@/components/admin/QuickActionsGrid'), {
  loading: () => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>,
  ssr: false
});

// Memoized header component
const DashboardHeader = memo(({ userName, onSignOut }: { userName: string; onSignOut: () => void }) => {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      {/* Header content */}
    </header>
  );
});
DashboardHeader.displayName = 'DashboardHeader';

export { StatCards, RecentOrdersWidget, PendingPaymentsWidget, ActivityFeed, SystemHealthWidget, QuickActionsGrid, DashboardHeader };
