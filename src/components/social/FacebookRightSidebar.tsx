'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OnlineStatus from './OnlineStatus';
import {
  UserPlus,
  X,
  Gift,
  Users,
  TrendingUp
} from 'lucide-react';

interface SuggestedFriend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  level: number;
  verified: boolean;
  mutualFriends: number;
  membershipPlan: string;
  partnerLevel: string;
}

interface Birthday {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  icon: string;
}

export default function FacebookRightSidebar() {
  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  // Fetch real data from APIs
  const fetchSidebarData = async () => {
    try {
      // Fetch user suggestions (reel creators)
      const suggestionsResponse = await fetch('/api/social/suggestions?limit=3');
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        if (suggestionsData.success && suggestionsData.suggestions) {
          // Map suggestions to SuggestedFriend format
          const mappedFriends = suggestionsData.suggestions.map((s: any) => ({
            id: s.id,
            name: s.name,
            username: s.username,
            avatar: s.image,
            level: 1,
            verified: false,
            mutualFriends: s.mutualFriends || 0,
            membershipPlan: 'Basic',
            partnerLevel: 'Level 1'
          }));
          setSuggestedFriends(mappedFriends);
        }
      }

      // Fetch birthdays (for today) - optional, can be removed if not needed
      const birthdayResponse = await fetch('/api/social/users?type=birthdays&limit=5');
      if (birthdayResponse.ok) {
        const birthdayData = await birthdayResponse.json();
        if (birthdayData.success) {
          setBirthdays(birthdayData.users || []);
        }
      }

      // Fetch suggested groups
      const groupsResponse = await fetch('/api/social/groups?limit=2');
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        if (groupsData.success) {
          setSuggestedGroups(groupsData.groups || []);
        }
      }
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchSidebarData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAddFriend = async (userId: string) => {
    try {
      setSendingRequest(userId);
      const res = await fetch('/api/social/friend-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Remove user from suggestions after sending request
        setSuggestedFriends(prev => prev.filter(friend => friend.id !== userId));
        console.log('Friend request sent successfully');
      } else {
        console.error('Failed to send friend request:', data.error);
        alert(data.error || 'Failed to send friend request. Please try again.');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleDismiss = (userId: string) => {
    setSuggestedFriends(prev => prev.filter(friend => friend.id !== userId));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
      {/* Online Status - Team Members */}
      <OnlineStatus />

      {/* Birthdays Card */}
      {birthdays.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-gray-700">
              <Gift className="h-5 w-5 mr-2 text-blue-600" />
              Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {birthdays.map((person) => (
                <div key={person.id} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                      {person.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="text-blue-600">{person.name}</span>
                    </p>
                    <p className="text-xs text-gray-500">has a birthday today</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* People You May Know */}
      {suggestedFriends.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-gray-700">
              <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
              People You May Know
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {suggestedFriends.map((person) => (
              <div key={person.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {person.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {person.name}
                    </p>
                    <p className="text-xs text-gray-500">{person.membershipPlan} • L{person.level}</p>
                    <p className="text-xs text-gray-400">
                      {person.mutualFriends} mutual connections
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleAddFriend(person.id)}
                    disabled={sendingRequest === person.id}
                  >
                    {sendingRequest === person.id ? 'Sending...' : 'Add Friend'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => handleDismiss(person.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700">
              See All
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Suggested Groups */}
      {suggestedGroups.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center text-gray-700">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Suggested Groups
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {suggestedGroups.map((group) => (
              <div key={group.id} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                  {group.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{group.name}</p>
                  <p className="text-xs text-gray-500">{group.members} members</p>
                  <p className="text-xs text-gray-400">{group.category}</p>
                </div>
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                  Join
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Trending Topics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center text-gray-700">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">#MLMSuccess</p>
                <p className="text-xs text-gray-500">2.1k posts</p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">#NetworkMarketing</p>
                <p className="text-xs text-gray-500">1.8k posts</p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">#TeamBuilding</p>
                <p className="text-xs text-gray-500">956 posts</p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
