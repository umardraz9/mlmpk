'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  ShoppingBag,
  FileText,
  MessageCircle,
  Users,
  BarChart3,
  Package,
  Settings,
  Wallet,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  isDark: boolean;
}

const QuickActionCard: React.FC<QuickActionCardProps> = memo(({
  title,
  description,
  icon: Icon,
  path,
  color,
  isDark
}) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(path)}
      className={`group bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${color} shadow-md group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`w-5 h-5 rounded-full ${color} opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
      <h4 className={`font-bold mb-1 transition-colors ${
        isDark ? 'text-white group-hover:text-green-400' : 'text-gray-900 group-hover:text-green-600'
      }`}>
        {title}
      </h4>
      <p className={`text-sm transition-colors ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {description}
      </p>
    </div>
  );
});

QuickActionCard.displayName = 'QuickActionCard';

interface QuickActionsProps {
  isDark: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = memo(({ isDark }) => {
  const actions = [
    {
      title: 'Start Tasks',
      description: 'Complete daily tasks to earn money',
      icon: Target,
      path: '/tasks',
      color: 'bg-gradient-to-r from-green-600 to-emerald-600'
    },
    {
      title: 'Shop Products',
      description: 'Browse and purchase products',
      icon: ShoppingBag,
      path: '/products',
      color: 'bg-gradient-to-r from-blue-600 to-indigo-600'
    },
    {
      title: 'Read Articles',
      description: 'Latest tips and insights',
      icon: FileText,
      path: '/blog',
      color: 'bg-gradient-to-r from-purple-600 to-purple-700'
    },
    {
      title: 'Get Support',
      description: 'Contact our support team',
      icon: MessageCircle,
      path: '/support',
      color: 'bg-gradient-to-r from-orange-600 to-orange-700'
    },
    {
      title: 'My Team',
      description: 'View your referral network',
      icon: Users,
      path: '/dashboard/team',
      color: 'bg-gradient-to-r from-teal-600 to-cyan-600'
    },
    {
      title: 'Analytics',
      description: 'Track your performance',
      icon: BarChart3,
      path: '/dashboard/analytics',
      color: 'bg-gradient-to-r from-pink-600 to-rose-600'
    },
    {
      title: 'My Orders',
      description: 'View order history',
      icon: Package,
      path: '/orders',
      color: 'bg-gradient-to-r from-yellow-600 to-orange-600'
    },
    {
      title: 'Settings',
      description: 'Account and preferences',
      icon: Settings,
      path: '/settings',
      color: 'bg-gradient-to-r from-gray-600 to-gray-700'
    },
    {
      title: 'Wallet',
      description: 'View balance and transactions',
      icon: Wallet,
      path: '/wallet',
      color: 'bg-gradient-to-r from-green-500 to-emerald-600'
    },
    {
      title: 'Vouchers',
      description: 'Available discount vouchers',
      icon: Gift,
      path: '/vouchers',
      color: 'bg-gradient-to-r from-red-600 to-pink-600'
    }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border p-6 transition-colors ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Quick Actions
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Access frequently used features
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {actions.map((action, index) => (
          <QuickActionCard
            key={index}
            title={action.title}
            description={action.description}
            icon={action.icon}
            path={action.path}
            color={action.color}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;
