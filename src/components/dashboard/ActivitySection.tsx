'use client';

import React, { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Users, DollarSign, CheckCircle } from 'lucide-react';
import type { RecentActivity } from './DashboardInterfaces';

interface ActivitySectionProps {
  userId?: string;
}

const ActivitySection: React.FC<ActivitySectionProps> = memo(({ userId }) => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockActivities: RecentActivity[] = [
      {
        id: '1',
        type: 'earning',
        description: 'Daily task completed',
        amount: 500,
        timestamp: new Date().toISOString(),
        status: 'completed'
      },
      {
        id: '2',
        type: 'referral',
        description: 'New team member joined',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed'
      },
      {
        id: '3',
        type: 'task',
        description: 'Product review task',
        amount: 200,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        status: 'pending'
      },
      {
        id: '4',
        type: 'withdrawal',
        description: 'Withdrawal request',
        amount: 10000,
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        status: 'completed'
      }
    ];

    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 500);
  }, [userId]);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'earning':
        return <DollarSign className="w-4 h-4" />;
      case 'referral':
        return <Users className="w-4 h-4" />;
      case 'task':
        return <CheckCircle className="w-4 h-4" />;
      case 'withdrawal':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'earning':
        return 'bg-green-500';
      case 'referral':
        return 'bg-blue-500';
      case 'task':
        return 'bg-purple-500';
      case 'withdrawal':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center text-white`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activity.amount && (
                    <span className="text-sm font-medium">
                      PKR {activity.amount.toLocaleString()}
                    </span>
                  )}
                  <Badge
                    variant={activity.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ActivitySection.displayName = 'ActivitySection';

export default ActivitySection;
