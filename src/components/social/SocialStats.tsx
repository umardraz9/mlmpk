'use client';

import React, { memo } from 'react';
import { Users, MessageCircle, Heart, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Stats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalMembers: number;
}

interface SocialStatsProps {
  stats: Stats;
  isLoading?: boolean;
}

export const SocialStats: React.FC<SocialStatsProps> = memo(({
  stats,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="text-center p-4">
            <div className="animate-pulse">
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Normalize values to avoid runtime errors on toLocaleString
  const totalMembers = Number(stats?.totalMembers ?? 0);
  const totalPosts = Number(stats?.totalPosts ?? 0);
  const totalLikes = Number(stats?.totalLikes ?? 0);
  const achievements = Math.floor(totalPosts * 0.15);

  const statCards = [
    {
      title: 'Community Members',
      value: totalMembers.toLocaleString(),
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Posts Today',
      value: totalPosts.toLocaleString(),
      icon: MessageCircle,
      gradient: 'from-green-500 to-green-600',
      iconColor: 'text-green-600'
    },
    {
      title: 'Likes This Week',
      value: totalLikes.toLocaleString(),
      icon: Heart,
      gradient: 'from-purple-500 to-purple-600',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Achievements',
      value: achievements.toLocaleString(), // Estimate
      icon: Trophy,
      gradient: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card
            key={index}
            className="text-center p-4 bg-gradient-to-r text-white hover:shadow-lg transition-shadow duration-200"
            style={{ background: `linear-gradient(to right, ${stat.gradient.split(' ')[0]}, ${stat.gradient.split(' ')[1]})` }}
          >
            <IconComponent className="h-6 w-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-90">{stat.title}</div>
          </Card>
        );
      })}
    </div>
  );
});

SocialStats.displayName = 'SocialStats';
