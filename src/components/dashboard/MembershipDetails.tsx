'use client';

import React, { memo } from 'react';
import { Crown, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

interface MembershipPlan {
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
}

interface UserStats {
  membershipPlan?: MembershipPlan;
  membershipStatus?: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
  earningDaysRemaining?: number;
  activeDays?: number;
}

interface MembershipDetailsProps {
  stats: UserStats | null;
  isDark: boolean;
}

export const MembershipDetails: React.FC<MembershipDetailsProps> = memo(({
  stats,
  isDark
}) => {
  const router = useRouter();

  if (!stats?.membershipPlan) return null;

  const plan = stats.membershipPlan as MembershipPlan;
  const membershipStatus = stats.membershipStatus || 'ACTIVE';
  const membershipStartDate = stats.membershipStartDate ? new Date(stats.membershipStartDate) : null;
  const membershipEndDate = stats.membershipEndDate ? new Date(stats.membershipEndDate) : null;
  const earningDaysRemaining = stats.earningDaysRemaining || 0;
  const activeDays = stats.activeDays || 0;

  // Calculate progress
  const totalDays = plan.maxEarningDays || 30;
  const daysUsed = totalDays - earningDaysRemaining;
  const progressPercentage = Math.min(100, Math.max(0, (daysUsed / totalDays) * 100));

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color and icon
  const getStatusInfo = () => {
    switch (membershipStatus) {
      case 'ACTIVE':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'EXPIRED':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600'
        };
      case 'PENDING':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertCircle,
          iconColor: 'text-gray-600'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border p-6 transition-colors ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Active Membership Plan
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Your current subscription details
            </p>
          </div>
        </div>
        <Badge className={`${statusInfo.color} flex items-center gap-1`}>
          <StatusIcon className={`w-3 h-3 ${statusInfo.iconColor}`} />
          {membershipStatus}
        </Badge>
      </div>

      {/* Plan Details */}
      <div className={`p-4 rounded-lg mb-6 transition-colors ${
        isDark ? 'bg-gray-700' : 'bg-gradient-to-r from-purple-50 to-indigo-50'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {plan.displayName || plan.name}
            </h4>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Investment: {formatCurrency(plan.price)}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold text-purple-600`}>
              {formatCurrency(plan.dailyTaskEarning)}
            </p>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Daily Earning
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Earning Progress
            </span>
            <span className={`text-sm font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {daysUsed} / {totalDays} days
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs mt-1">
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              {earningDaysRemaining} days remaining
            </span>
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              {Math.round(progressPercentage)}% complete
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`text-center p-3 rounded-lg transition-colors ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-600">
            {plan.tasksPerDay || 5}
          </div>
          <div className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Tasks/Day
          </div>
        </div>

        <div className={`text-center p-3 rounded-lg transition-colors ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
            <Calendar className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-lg font-bold text-green-600">
            {activeDays}
          </div>
          <div className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Active Days
          </div>
        </div>

        <div className={`text-center p-3 rounded-lg transition-colors ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
            <Crown className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-purple-600">
            {formatCurrency(plan.voucherAmount)}
          </div>
          <div className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Voucher
          </div>
        </div>

        <div className={`text-center p-3 rounded-lg transition-colors ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-lg font-bold text-orange-600">
            {formatCurrency(plan.minimumWithdrawal)}
          </div>
          <div className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Min Withdrawal
          </div>
        </div>
      </div>

      {/* Membership Dates */}
      {(membershipStartDate || membershipEndDate) && (
        <div className={`p-4 rounded-lg mb-6 transition-colors ${
          isDark ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h4 className={`font-semibold mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Membership Period
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {membershipStartDate && (
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Start Date
                </p>
                <p className={`font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatDate(membershipStartDate)}
                </p>
              </div>
            )}
            {membershipEndDate && (
              <div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  End Date
                </p>
                <p className={`font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatDate(membershipEndDate)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => router.push('/membership')}
          variant="outline"
          className="flex-1"
        >
          View All Plans
        </Button>
        {membershipStatus === 'ACTIVE' && (
          <Button
            onClick={() => router.push('/membership/upgrade')}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Upgrade Plan
          </Button>
        )}
        {membershipStatus === 'EXPIRED' && (
          <Button
            onClick={() => router.push('/membership/renew')}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Renew Plan
          </Button>
        )}
      </div>
    </div>
  );
});

MembershipDetails.displayName = 'MembershipDetails';
