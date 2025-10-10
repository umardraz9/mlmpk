'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface FriendRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  sender: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
}

interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: string;
  createdAt: string;
  friend: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
}

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.id) {
      router.push('/auth/signin');
      return;
    }
    fetchFriendRequests();
    fetchFriends();
  }, [session, status, router]);

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch('/api/social/friend-requests');
      const data = await response.json();

      if (response.ok) {
        setFriendRequests(data.friendRequests || []);
      } else {
        toast.error('Failed to fetch friend requests');
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      toast.error('Error loading friend requests');
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/social/friends');
      const data = await response.json();

      if (response.ok) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessing(requestId);

    try {
      const response = await fetch(`/api/social/friend-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Friend request ${action}ed successfully`);

        // Update local state
        if (action === 'accept') {
          // Remove from requests and add to friends
          setFriendRequests(prev => prev.filter(req => req.id !== requestId));
          await fetchFriends(); // Refresh friends list
        } else {
          // Just remove from requests
          setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        }
      } else {
        toast.error(data.error || `Failed to ${action} friend request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
      toast.error(`Failed to ${action} friend request`);
    } finally {
      setProcessing(null);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Friends & Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your friend requests and connections
          </p>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Friend Requests
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Friends ({friends.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            {friendRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No friend requests
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                    When someone sends you a friend request, it will appear here. You can accept or decline requests to build your network.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img
                            src={request.sender.image}
                            alt={request.sender.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.sender.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{request.sender.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Sent {getRelativeTime(request.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFriendRequest(request.id, 'reject')}
                            disabled={processing === request.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Decline
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleFriendRequest(request.id, 'accept')}
                            disabled={processing === request.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends" className="mt-6">
            {friends.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No friends yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                    Start building your network by accepting friend requests or sending requests to people you know.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friendship) => (
                    <Card key={friendship.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={friendship.friend.image}
                            alt={friendship.friend.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {friendship.friend.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              @{friendship.friend.username}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                          Friends since {getRelativeTime(friendship.createdAt)}
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
