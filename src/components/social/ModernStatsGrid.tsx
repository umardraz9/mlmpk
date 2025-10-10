'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Heart,
  Users,
  TrendingUp,
  Activity,
  Eye,
  Award
} from 'lucide-react';

interface Stats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalMembers: number;
  engagementRate?: number;
  activeUsers?: number;
  shares?: number;
  reach?: number;
}

interface ModernStatsGridProps {
  stats: Stats;
  isLoading?: boolean;
}

export default function ModernStatsGrid({ stats, isLoading = false }: ModernStatsGridProps) {
  const { isDark } = useTheme();
  const statItems = [
    {
      title: 'Total Posts',
      value: stats.totalPosts,
      icon: MessageCircle,
      color: 'from-blue-500 to-blue-600',
      bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Likes',
      value: stats.totalLikes,
      icon: Heart,
      color: 'from-red-500 to-red-600',
      bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50',
      iconColor: isDark ? 'text-red-400' : 'text-red-600',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Total Comments',
      value: stats.totalComments,
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
      iconColor: isDark ? 'text-green-400' : 'text-green-600',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Active Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: isDark ? 'bg-purple-900/20' : 'bg-purple-50',
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      trend: '+5%',
      trendUp: true
    },
    {
      title: 'Engagement Rate',
      value: stats.engagementRate || 0,
      suffix: '%',
      icon: TrendingUp,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
      iconColor: isDark ? 'text-yellow-400' : 'text-yellow-600',
      trend: '+2.3%',
      trendUp: true
    },
    {
      title: 'Total Reach',
      value: stats.reach || 0,
      icon: Eye,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: isDark ? 'bg-indigo-900/20' : 'bg-indigo-50',
      iconColor: isDark ? 'text-indigo-400' : 'text-indigo-600',
      trend: '+18%',
      trendUp: true
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className={`animate-pulse ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className={`h-4 rounded w-16 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className={`h-6 rounded w-12 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </div>
                <div className={`h-8 w-8 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${item.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <Badge
                    variant={item.trendUp ? "default" : "secondary"}
                    className={`text-xs ${
                      item.trendUp
                        ? `${isDark ? 'bg-green-800 text-green-200 hover:bg-green-700' : 'bg-green-100 text-green-700 hover:bg-green-200'}`
                        : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }`}
                  >
                    {item.trend}
                  </Badge>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {typeof item.value === 'number' && item.value >= 1000
                      ? `${(item.value / 1000).toFixed(1)}k`
                      : item.value
                    }
                    {item.suffix}
                  </p>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.title}
                  </p>
                </div>

                {/* Animated background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-lg pointer-events-none`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions Row */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className={`text-xs px-3 py-1 ${isDark ? 'bg-blue-900/20 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          <Activity className="h-3 w-3 mr-1" />
          Live Activity
        </Badge>
        <Badge variant="outline" className={`text-xs px-3 py-1 ${isDark ? 'bg-green-900/20 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-200'}`}>
          <TrendingUp className="h-3 w-3 mr-1" />
          Trending Now
        </Badge>
        <Badge variant="outline" className={`text-xs px-3 py-1 ${isDark ? 'bg-purple-900/20 text-purple-300 border-purple-700' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
          <Award className="h-3 w-3 mr-1" />
          Top Contributors
        </Badge>
      </div>
    </div>
  );
}
