'use client';

import React from 'react';
import { Activity, Server } from 'lucide-react';
import { ActivityItem, SystemHealthItem } from './AdminComponents';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  todayRegistrations: number;
  pendingWithdrawals: number;
  recentActivity?: {
    registrations?: { id: string; name?: string | null; email?: string | null }[];
    taskCompletions?: { id: string; task: { title: string }; user: { name: string } }[];
  };
  todayCommissions?: number;
}

interface StatusSectionProps {
  stats: AdminStats;
}

export const StatusSection: React.FC<StatusSectionProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-600">Latest platform activities</p>
          </div>
        </div>
        <div className="space-y-4">
          {stats.recentActivity?.registrations?.slice(0, 3).map((activity) => (
            <ActivityItem
              key={activity.id}
              icon={() => <div className="w-2 h-2 bg-green-500 rounded-full" />}
              color="bg-green-500"
              text={`New user: ${activity.name || activity.email}`}
              bgColor="bg-green-50"
            />
          ))}
          {stats.recentActivity?.taskCompletions?.slice(0, 2).map((activity) => (
            <ActivityItem
              key={activity.id}
              icon={() => <div className="w-2 h-2 bg-purple-500 rounded-full" />}
              color="bg-purple-500"
              text={`Task '${activity.task.title}' completed by ${activity.user.name}`}
              bgColor="bg-purple-50"
            />
          ))}
          {(stats.todayRegistrations || 0) > 0 && (
            <ActivityItem
              icon={() => <div className="w-2 h-2 bg-blue-500 rounded-full" />}
              color="bg-blue-500"
              text={`${stats.todayRegistrations} new registrations today`}
              bgColor="bg-blue-50"
            />
          )}
          {(stats.todayCommissions || 0) > 0 && (
            <ActivityItem
              icon={() => <div className="w-2 h-2 bg-orange-500 rounded-full" />}
              color="bg-orange-500"
              text={`Rs ${(stats.todayCommissions || 0).toLocaleString()} earned today`}
              bgColor="bg-orange-50"
            />
          )}
          {!stats.recentActivity?.registrations?.length && !stats.recentActivity?.taskCompletions?.length && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg">
            <Server className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">System Health</h3>
            <p className="text-sm text-gray-600">Platform status and metrics</p>
          </div>
        </div>
        <div className="space-y-4">
          <SystemHealthItem
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            bgColor="bg-green-50"
            textColor="text-green-800"
          />
          <SystemHealthItem
            label="Active Users"
            value={stats.activeUsers.toLocaleString()}
            bgColor="bg-blue-50"
            textColor="text-blue-800"
          />
          <SystemHealthItem
            label="Today's Registrations"
            value={stats.todayRegistrations}
            bgColor="bg-purple-50"
            textColor="text-purple-800"
          />
          <SystemHealthItem
            label="Pending Withdrawals"
            value={stats.pendingWithdrawals}
            bgColor="bg-orange-50"
            textColor="text-orange-800"
          />
          <div className="mt-6 p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <span className="font-medium">System Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span className="text-sm">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
