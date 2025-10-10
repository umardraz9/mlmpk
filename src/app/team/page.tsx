'use client';

import { useEffect, useState } from 'react';
import { 
  MobileLayout, 
  MobilePageContainer, 
  MobileSection, 
  MobileCard, 
  MobileGrid 
} from '@/components/layout/mobile-layout';
import { TouchButton } from '@/components/ui/mobile-touch';
import { 
  Users, 
  TrendingUp,
  Eye,
  Calendar,
  DollarSign,
  Network,
  UserPlus,
  
} from 'lucide-react';

interface RealTeamMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  level: number;
  status: 'online' | 'offline';
  lastActive: string;
  commission: number;
  role: string;
  joinedAt: string;
  totalPoints: number;
}

interface TeamStatsApi {
  totalMembers: number;
  activeMembers: number;
  totalCommission: number;
  avgLevel: number;
}

export default function TeamPage() {
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('list');

  const [members, setMembers] = useState<RealTeamMember[]>([]);
  const [stats, setStats] = useState<TeamStatsApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/social/team');
        if (res.status === 401) {
          throw new Error('Please log in to view your team.');
        }
        if (!res.ok) throw new Error('Failed to load team');
        const data = await res.json();
        if (!cancelled) {
          setMembers(data.teamMembers || []);
          setStats(data.stats || null);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load team');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true };
  }, []);

  const filteredMembers = selectedLevel === 'all' 
    ? members 
    : members.filter(member => member.level === selectedLevel);

  const teamStats = {
    totalMembers: stats?.totalMembers ?? members.length,
    activeMembers: stats?.activeMembers ?? members.filter(m => m.status === 'online').length,
    totalCommission: stats?.totalCommission ?? members.reduce((sum, m) => sum + (m.commission || 0), 0),
    levels: members.length ? Math.max(...members.map(m => m.level)) : 0,
  };

  // Note: status color helper removed; UI uses neutral text styles only

  return (
    <MobileLayout 
      title="My Team Network" 
      subtitle="Manage and track your team&apos;s performance"
      showShareButton
    >
      <MobilePageContainer>
        {error && (
          <div className="p-3 text-sm text-red-600">{error}</div>
        )}
        {loading && members.length === 0 && (
          <div className="p-3 text-sm text-gray-600">Loading team...</div>
        )}
        {/* Team Stats */}
        <MobileSection title="Team Overview">
          <MobileGrid columns={2}>
            <MobileCard className="text-center">
              <div className="p-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</p>
                <p className="text-xs text-gray-600">Total Members</p>
              </div>
            </MobileCard>
            
            <MobileCard className="text-center">
              <div className="p-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{teamStats.activeMembers}</p>
                <p className="text-xs text-gray-600">Active Members</p>
              </div>
            </MobileCard>
            
            <MobileCard className="text-center">
              <div className="p-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Network className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{teamStats.levels}</p>
                <p className="text-xs text-gray-600">Network Levels</p>
              </div>
            </MobileCard>
            
            <MobileCard className="text-center">
              <div className="p-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-lg font-bold text-gray-900">PKR {Math.round(teamStats.totalCommission).toLocaleString()}</p>
                <p className="text-xs text-gray-600">Total Commission</p>
              </div>
            </MobileCard>
          </MobileGrid>
        </MobileSection>

        {/* Filters */}
        <MobileSection title="Filter & View">
          <div className="space-y-4">
            {/* Level Filters */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Filter by Level</p>
              <div className="flex gap-2 flex-wrap">
                <TouchButton
                  variant={selectedLevel === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLevel('all')}
                  className="text-xs"
                >
                  All Levels
                </TouchButton>
                {[1, 2, 3, 4, 5].map(level => (
                  <TouchButton
                    key={level}
                    variant={selectedLevel === level ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLevel(level)}
                    className="text-xs"
                  >
                    Level {level}
                  </TouchButton>
                ))}
              </div>
            </div>
            
            {/* View Mode */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">View Mode</p>
              <div className="flex gap-2">
                <TouchButton
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1 text-xs"
                >
                  List View
                </TouchButton>
                <TouchButton
                  variant={viewMode === 'tree' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('tree')}
                  className="flex-1 text-xs"
                >
                  Tree View
                </TouchButton>
              </div>
            </div>
          </div>
        </MobileSection>

        {/* Team Members */}
        <MobileSection title="Team Members">
          <div className="space-y-3">
            {!loading && filteredMembers.length === 0 && (
              <MobileCard>
                <div className="p-4 text-sm text-gray-600">No team members found.</div>
              </MobileCard>
            )}
            {filteredMembers.map((member) => (
              <MobileCard key={member.id} clickable>
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{member.name}</h3>
                        <span className="text-xs text-gray-500 truncate">@{member.username}</span>
                      </div>
                      <p className="text-xs text-gray-600">Level {member.level} • {member.role} • {member.status}</p>
                    </div>
                  </div>
                  
                  {/* Mobile Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">Points</p>
                      <p className="text-sm font-semibold text-gray-900">{member.totalPoints}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600">Commission</p>
                      <p className="text-sm font-semibold text-green-600">PKR {Math.round(member.commission).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <UserPlus className="h-3 w-3" />
                      <span className="truncate">{member.role}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(member.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <TouchButton size="sm" variant="outline" className="flex-1 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </TouchButton>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileSection>

        {/* Grow Your Team */}
        <MobileSection title="Grow Your Team">
          <MobileCard className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <UserPlus className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Invite New Members</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Invite new members to join your network and increase your earnings
              </p>
              <div className="space-y-2">
                <TouchButton className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Share Referral Link
                </TouchButton>
                <div className="grid grid-cols-2 gap-2">
                  <TouchButton variant="outline" className="text-xs border-green-600 text-green-700">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Leaderboard
                  </TouchButton>
                  <TouchButton variant="outline" className="text-xs border-green-600 text-green-700">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Benefits
                  </TouchButton>
                </div>
              </div>
            </div>
          </MobileCard>
        </MobileSection>

        {/* Team Building Tips */}
        <MobileSection title="Team Building Tips">
          <div className="space-y-3">
            <MobileCard>
              <div className="flex items-center space-x-3 p-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Recruit Actively</h3>
                  <p className="text-xs text-gray-600">Share your referral code with friends and family</p>
                </div>
              </div>
            </MobileCard>
            
            <MobileCard>
              <div className="flex items-center space-x-3 p-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Support Your Team</h3>
                  <p className="text-xs text-gray-600">Help your team members succeed to maximize earnings</p>
                </div>
              </div>
            </MobileCard>
            
            <MobileCard>
              <div className="flex items-center space-x-3 p-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Track Performance</h3>
                  <p className="text-xs text-gray-600">Monitor your team&apos;s growth and earnings</p>
                </div>
              </div>
            </MobileCard>
          </div>
        </MobileSection>
      </MobilePageContainer>
    </MobileLayout>
  );
}