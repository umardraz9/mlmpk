'use client';

import React from 'react';
import { Users, CheckSquare, Network, BarChart3, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { NavigationCard } from './AdminComponents';

export const NavigationSection: React.FC = () => {
  const navigationItems = [
    {
      title: 'User Management',
      description: 'Manage all platform users',
      icon: Users,
      color: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      path: '/admin/users'
    },
    {
      title: 'Task Management',
      description: 'Create and manage tasks',
      icon: CheckSquare,
      color: 'bg-gradient-to-r from-purple-600 to-purple-700',
      path: '/admin/tasks'
    },
    {
      title: 'MLM Network',
      description: 'View network structure',
      icon: Network,
      color: 'bg-gradient-to-r from-green-600 to-emerald-600',
      path: '/admin/mlm-network'
    },
    {
      title: 'Analytics',
      description: 'Detailed platform insights',
      icon: BarChart3,
      color: 'bg-gradient-to-r from-orange-600 to-orange-700',
      path: '/admin/analytics'
    },
    {
      title: 'Withdrawals',
      description: 'View and manage requests',
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-orange-600 to-orange-700',
      path: '/admin/withdrawals'
    },
    {
      title: 'Finance',
      description: 'Transactions and revenue',
      icon: DollarSign,
      color: 'bg-gradient-to-r from-green-600 to-emerald-600',
      path: '/admin/finance'
    },
    {
      title: 'Security',
      description: 'Security overview and logs',
      icon: Shield,
      color: 'bg-gradient-to-r from-red-600 to-red-700',
      path: '/admin/security'
    }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Navigation</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {navigationItems.map((item) => (
          <NavigationCard
            key={item.path}
            title={item.title}
            description={item.description}
            icon={item.icon}
            color={item.color}
            path={item.path}
          />
        ))}
      </div>
    </div>
  );
};
