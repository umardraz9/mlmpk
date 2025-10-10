'use client';

import React, { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import type { TeamMember } from './DashboardInterfaces';

interface TeamSectionProps {
  userId?: string;
}

const TeamSection: React.FC<TeamSectionProps> = memo(({ userId }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockTeam: TeamMember[] = [
      {
        id: '1',
        name: 'Ahmed Khan',
        joinDate: '2024-01-15',
        earnings: 25000,
        status: 'active',
        level: 1
      },
      {
        id: '2',
        name: 'Sarah Ali',
        joinDate: '2024-02-20',
        earnings: 18000,
        status: 'active',
        level: 2
      },
      {
        id: '3',
        name: 'Hassan Malik',
        joinDate: '2024-03-10',
        earnings: 12000,
        status: 'inactive',
        level: 1
      }
    ];

    setTimeout(() => {
      setTeam(mockTeam);
      setLoading(false);
    }, 500);
  }, [userId]);

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
          <Users className="w-5 h-5" />
          Team Members
        </CardTitle>
        <Badge variant="secondary">{team.length} Total</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {team.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No team members yet. Start inviting!
            </div>
          ) : (
            team.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">Level {member.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {member.status === 'active' ? (
                      <UserCheck className="w-3 h-3 mr-1" />
                    ) : (
                      <UserX className="w-3 h-3 mr-1" />
                    )}
                    {member.status}
                  </Badge>
                  <span className="text-sm font-medium">
                    PKR {member.earnings.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TeamSection.displayName = 'TeamSection';

export default TeamSection;
