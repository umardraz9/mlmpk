'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { UserStats } from './DashboardInterfaces';
import {
  Users,
  Gift,
  DollarSign,
  Target
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

const StatsCard = memo(({ title, value, icon: Icon, trend, color }: StatsCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className={`text-xs mt-1 ${
                trend.startsWith('+') ? 'text-green-600' : 'text-gray-500'
              }`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = 'StatsCard';

interface DashboardStatsProps {
  stats: UserStats;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title="Total Earnings"
        value={formatCurrency(stats.totalEarnings)}
        icon={DollarSign}
        trend={`+${formatCurrency(stats.todayEarnings)} today`}
        color="bg-gradient-to-br from-green-500 to-green-600"
      />
      
      <StatsCard
        title="Voucher Balance"
        value={formatCurrency(stats.voucherBalance)}
        icon={Gift}
        color="bg-gradient-to-br from-purple-500 to-purple-600"
      />
      
      <StatsCard
        title="Team Members"
        value={stats.referralCount}
        icon={Users}
        trend={`${stats.activeReferrals} active`}
        color="bg-gradient-to-br from-blue-500 to-blue-600"
      />
      
      <StatsCard
        title="Tasks Completed"
        value={stats.tasksCompleted}
        icon={Target}
        trend={`${stats.tasksRemaining} remaining`}
        color="bg-gradient-to-br from-orange-500 to-orange-600"
      />
    </div>
  );
};

export default memo(DashboardStats);
