'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Video,
  Heart,
  MessageCircle,
  Share2,
  Play,
  Volume2,
  VolumeX
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

interface FriendRequest {
  id: string;
  sender: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export default function SocialDiscovery() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('suggestions');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [suggestionsRes, reelsRes, requestsRes] = await Promise.all([
        fetch('/api/social/suggestions'),
        fetch('/api/social/reels'),
        fetch('/api/social/friend-requests')
      ]);

      if (suggestionsRes.ok) {
        const suggestionsData = await suggestionsRes.json();
        setSuggestions(suggestionsData.suggestions || []);
      }

      if (reelsRes.ok) {
        const reelsData = await reelsRes.json();
        setReels(reelsData.reels || []);
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setFriendRequests(requestsData.requests || []);
      }
    } catch (error) {
      console.error('Failed to load social data:', error);
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

  const handleFriendRequest = async (userId: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/social/friend-requests/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setFriendRequests(prev =>
          prev.filter(request => request.sender.id !== userId)
        );
      }
    } catch (error) {
      console.error('Failed to handle friend request:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Discovery</h1>
          <p className="text-gray-600">Discover new people, watch reels, and manage your connections</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="reels" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Reels
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Requests ({friendRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  People You May Know
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {suggestions.map((user) => (
                      <Card key={user.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative w-12 h-12">
                            <Image
                              src={user.image || '/api/placeholder/50/50'}
                              alt={user.name}
                              fill
                              className="rounded-full object-cover cursor-pointer"
                              sizes="48px"
                              onClick={() => {
                                const profileId = user.username || user.id;
                                if (profileId) router.push(`/social/profile/${profileId}`);
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p
                              className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => {
                                const profileId = user.username || user.id;
                                if (profileId) router.push(`/social/profile/${profileId}`);
                              }}
                            >
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          </div>
                        </div>

                        {user.bio && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.bio}</p>
                        )}

                        {user.mutualFriends > 0 && (
                          <p className="text-sm text-blue-600 mb-3">
                            {user.mutualFriends} mutual friend{user.mutualFriends !== 1 ? 's' : ''}
                          </p>
                        )}

                        <Button
                          className={`w-full ${user.isFollowing
                            ? 'bg-gray-600 hover:bg-gray-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          onClick={() => handleFollow(user.id)}
                        >
                          {user.isFollowing ? (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Following
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Follow
                            </>
                          )}
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No suggestions available</p>
                    <p className="text-gray-500 text-sm mt-1">Check back later for new people to connect with!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reels Tab */}
          <TabsContent value="reels" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  Trending Reels
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reels.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reels.map((reel) => (
                      <ReelCard key={reel.id} reel={reel} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No reels available</p>
                    <p className="text-gray-500 text-sm mt-1">Be the first to share a reel!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friend Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Friend Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendRequests.length > 0 ? (
                  <div className="space-y-4">
                    {friendRequests.map((request) => (
                      <Card key={request.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12">
                              <Image
                                src={request.sender.image || '/api/placeholder/50/50'}
                                alt={request.sender.name}
                                fill
                                className="rounded-full object-cover cursor-pointer"
                                sizes="48px"
                                onClick={() => {
                                  const profileId = request.sender.username || request.sender.id;
                                  if (profileId) router.push(`/social/profile/${profileId}`);
                                }}
                              />
                            </div>
                            <div>
                              <p
                                className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => {
                                  const profileId = request.sender.username || request.sender.id;
                                  if (profileId) router.push(`/social/profile/${profileId}`);
                                }}
                              >
                                {request.sender.name}
                              </p>
                              <p className="text-sm text-gray-500">@{request.sender.username}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleFriendRequest(request.sender.id, 'accept')}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleFriendRequest(request.sender.id, 'reject')}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No friend requests</p>
                    <p className="text-gray-500 text-sm mt-1">Friend requests will appear here when people want to connect with you!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ReelCard({ reel }: { reel: Reel }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-[9/16] bg-gray-900 group">
        <video
          src={reel.videoUrl}
          poster={reel.thumbnailUrl}
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          muted={isMuted}
        />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            className="rounded-full bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <Play className="h-6 w-6" />
          </Button>
        </div>

        {/* Sound Toggle */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 text-white hover:bg-white/20"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {Math.floor(reel.duration / 60)}:{(reel.duration % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <CardContent className="p-4">
        <p className="text-gray-900 mb-2 line-clamp-2">{reel.caption}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{reel.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{reel.comments}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              <span>{reel.shares}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6">
            <Image
              src={reel.author.image || '/api/placeholder/24/24'}
              alt={reel.author.name}
              fill
              className="rounded-full object-cover"
              sizes="24px"
            />
          </div>
          <span className="text-sm text-gray-600">@{reel.author.username}</span>
        </div>
      </CardContent>
    </Card>
  );
}
