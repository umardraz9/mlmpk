'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  UserCheck,
  Video,
  Heart,
  MessageCircle
} from 'lucide-react';
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

interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
  likes: number;
  comments: number;
  shares: number;
  duration: number;
  createdAt: string;
}

export function DiscoveryFeed() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suggestionsRes, reelsRes] = await Promise.all([
        fetch('/api/social/suggestions'),
        fetch('/api/social/reels')
      ]);

      if (suggestionsRes.ok) {
        const suggestionsData = await suggestionsRes.json();
        setSuggestions(suggestionsData.suggestions?.slice(0, 3) || []);
      }

      if (reelsRes.ok) {
        const reelsData = await reelsRes.json();
        setReels(reelsData.reels?.slice(0, 2) || []);
      }
    } catch (error) {
      console.error('Failed to load discovery data:', error);
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

      if (res.ok) {
        setSuggestions(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
          )
        );
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* People You May Know Section */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              People You May Know
            </h3>
          </div>

          <div className="p-6">
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
                onClick={() => router.push('/social/discovery')}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                View All Suggestions
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reels Section */}
      {reels.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              Trending Reels
            </h3>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Watch what's trending now:</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {reels.map((reel) => (
                <div key={reel.id} className="bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative aspect-[9/16] max-h-80">
                    <video
                      src={reel.videoUrl}
                      poster={reel.thumbnailUrl}
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(reel.duration / 60)}:{(reel.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-900">
                    <p className="text-white text-sm mb-2 line-clamp-2">{reel.caption}</p>
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{reel.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{reel.comments}</span>
                        </div>
                      </div>
                      <span className="text-gray-400">@{reel.author.username}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/social/reels')}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                View All Reels
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
