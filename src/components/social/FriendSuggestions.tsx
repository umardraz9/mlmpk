'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface UserSuggestion {
  id: string;
  name: string;
  username: string;
  image: string;
  bio: string;
  mutualFriends: number;
  isFollowing: boolean;
}

export function FriendSuggestions() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/suggestions');
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions?.slice(0, 3) || []);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update local state to reflect the change
        setSuggestions(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, isFollowing: data.isFollowing } : user
          )
        );
        
        console.log(`${data.isFollowing ? 'Following' : 'Unfollowed'} user successfully`);
      } else {
        console.error('Failed to follow user:', data.error);
        alert(data.error || 'Failed to follow user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Always show the component, even with no data
  // if (suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          People You May Know
        </h3>
      </div>

      <div className="p-6">
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No suggestions available right now</p>
            <p className="text-gray-400 text-xs mt-1">Check back later for people you may know</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">Connect with people in your network:</p>
            <div className="grid gap-3">
              {suggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image
                    src={user.image || '/api/placeholder/50/50'}
                    alt={user.name}
                    fill
                    className="rounded-full object-cover cursor-pointer"
                    sizes="40px"
                    onClick={() => {
                      const profileId = user.username || user.id;
                      if (profileId) router.push(`/social/profile/${profileId}`);
                    }}
                  />
                </div>
                <div>
                  <p
                    className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors text-sm"
                    onClick={() => {
                      const profileId = user.username || user.id;
                      if (profileId) router.push(`/social/profile/${profileId}`);
                    }}
                  >
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                  {user.mutualFriends > 0 && (
                    <p className="text-xs text-blue-600">{user.mutualFriends} mutual friends</p>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                className={`${user.isFollowing
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={() => handleFollow(user.id)}
              >
                {user.isFollowing ? (
                  <>
                    <UserCheck className="h-3 w-3 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/social/people')}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            View All Suggestions
          </Button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
