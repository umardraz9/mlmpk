'use client';

import React, { memo } from 'react';
import { CheckCircle, Clock, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';

interface TaskProgressProps {
  stats: any;
  todayTasks: any[];
  isDark: boolean;
}

export const TaskProgress: React.FC<TaskProgressProps> = memo(({
  stats,
  todayTasks,
  isDark
}) => {
  const router = useRouter();

  if (!stats) return null;

  // Calculate task metrics
  const tasksPerDayVal = ((stats as any)?.tasksPerDay) ??
                        ((stats.membershipPlan as any)?.tasksPerDay) ?? 5;
  const completionsVal = (stats as any)?.completionsToday || 0;
  const perTaskAmountVal = Math.round(
    stats.perTaskAmount ??
    (stats.membershipPlan ? stats.membershipPlan.dailyTaskEarning / tasksPerDayVal : 0)
  );
  const tasksLeftVal = Math.max(0, tasksPerDayVal - completionsVal);
  const completionPct = Math.min(100, Math.round((completionsVal / Math.max(1, tasksPerDayVal)) * 100));

  const taskStats = [
    {
      title: 'Tasks Completed',
      value: completionsVal,
      total: tasksPerDayVal,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Tasks Remaining',
      value: tasksLeftVal,
      total: tasksPerDayVal,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Daily Target',
      value: formatCurrency(stats.membershipPlan?.dailyTaskEarning || 0),
      total: tasksPerDayVal,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Today\'s Earnings',
      value: formatCurrency((completionsVal * perTaskAmountVal)),
      total: tasksPerDayVal,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

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
              Today's Task Progress
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {completionsVal} of {tasksPerDayVal} tasks completed
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/tasks')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Start Tasks
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Overall Progress
          </span>
          <span className={`text-sm font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {completionPct}%
          </span>
        </div>
        <Progress value={completionPct} className="h-3" />
      </div>

      {/* Task Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {taskStats.map((stat, index) => (
          <div
            key={index}
            className={`text-center p-4 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700' : 'bg-gray-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
              stat.bgColor
            }`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className={`text-xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => router.push('/tasks')}
          variant="outline"
          className="flex-1"
        >
          Continue Tasks ({tasksLeftVal} left)
        </Button>
        <Button
          onClick={() => router.push('/tasks/history')}
          variant="outline"
          className="flex-1"
        >
          View History
        </Button>
      </div>
    </div>
  );
});

TaskProgress.displayName = 'TaskProgress';
