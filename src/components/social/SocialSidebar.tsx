'use client';

import React, { memo } from 'react';
import { Users, Trophy, TrendingUp, Calendar, Award, Target, UserPlus, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  level: number;
  status: 'online' | 'offline';
  lastActive: string;
  commission: number;
}

interface LeaderboardMember {
  name: string;
  level: number;
  earnings: number;
  rank: number;
}

interface Event {
  title: string;
  date: string;
  type: 'meeting' | 'webinar' | 'ceremony';
}

interface SocialSidebarProps {
  teamMembers?: TeamMember[];
  isLoading?: boolean;
}

export const SocialSidebar: React.FC<SocialSidebarProps> = memo(({
  teamMembers = [],
  isLoading = false
}) => {
  // Mock data for demonstration
  const mockTeamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Sara Ahmed',
      avatar: '/api/placeholder/40/40',
      level: 6,
      status: 'online',
      lastActive: 'Active now',
      commission: 45600
    },
    {
      id: '2',
      name: 'Ali Raza',
      avatar: '/api/placeholder/40/40',
      level: 4,
      status: 'online',
      lastActive: '5 min ago',
      commission: 32100
    },
    {
      id: '3',
      name: 'Zara Khan',
      avatar: '/api/placeholder/40/40',
      level: 3,
      status: 'offline',
      lastActive: '2 hours ago',
      commission: 28900
    }
  ];

  const mockLeaderboard: LeaderboardMember[] = [
    { name: 'Ahmed Khan', level: 5, earnings: 89600, rank: 1 },
    { name: 'Sara Ahmed', level: 6, earnings: 76500, rank: 2 },
    { name: 'Ali Raza', level: 4, earnings: 65200, rank: 3 }
  ];

  const mockEvents: Event[] = [
    { title: 'Monthly Team Meeting', date: 'Tomorrow, 3:00 PM', type: 'meeting' },
    { title: 'Product Launch Webinar', date: 'Feb 5, 7:00 PM', type: 'webinar' },
    { title: 'Success Awards Ceremony', date: 'Feb 15, 6:00 PM', type: 'ceremony' }
  ];

  const mockTrendingTopics = [
    '#MLMSuccess', '#TeamBuilding', '#MonthlyGoals', '#ProductReview', '#MotivationMonday'
  ];

  const displayTeamMembers = teamMembers.length > 0 ? teamMembers : mockTeamMembers;

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Zap className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" disabled={isLoading}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
          <Button variant="outline" className="w-full" disabled={isLoading}>
            <Trophy className="h-4 w-4 mr-2" />
            Share Achievement
          </Button>
          <Button variant="outline" className="w-full" disabled={isLoading}>
            <Target className="h-4 w-4 mr-2" />
            Join Challenge
          </Button>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Users className="h-5 w-5 text-green-600" />
            Your Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            displayTeamMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                    <Badge className="text-xs bg-blue-100 text-blue-800">L{member.level}</Badge>
                  </div>
                  <p className="text-xs text-gray-600">{member.lastActive}</p>
                  <p className="text-xs text-green-600 font-medium">PKR {member.commission.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
          <Button variant="outline" size="sm" className="w-full text-gray-900">
            View All Team Members
          </Button>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockTrendingTopics.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-gray-200 text-gray-700 w-full justify-start text-left"
            >
              {tag}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Community Leaderboard */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockLeaderboard.map((leader) => (
            <div key={leader.rank} className="flex items-center gap-3 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
              <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full font-bold text-sm">
                {leader.rank}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={`/api/placeholder/40/40`} />
                <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{leader.name}</p>
                <p className="text-xs text-green-600 font-medium">PKR {leader.earnings.toLocaleString()}</p>
              </div>
              <Badge className="text-xs bg-blue-100 text-blue-800">L{leader.level}</Badge>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full text-gray-900">
            View Full Leaderboard
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Calendar className="h-5 w-5 text-purple-600" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockEvents.map((event, index) => (
            <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{event.date}</p>
              <Badge variant="secondary" className="text-xs mt-2 capitalize">
                {event.type}
              </Badge>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full text-gray-900">
            View All Events
          </Button>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card className="bg-gradient-to-r from-green-100 to-blue-100 border-green-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Award className="h-5 w-5 text-green-600" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Sales Master</p>
              <p className="text-xs text-gray-600">Completed this week</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
            <Users className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Team Builder</p>
              <p className="text-xs text-gray-600">3 days ago</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full text-gray-900">
            View All Achievements
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

SocialSidebar.displayName = 'SocialSidebar';
