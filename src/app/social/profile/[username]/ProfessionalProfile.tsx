'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditProfileModal from '@/components/profile/EditProfileModal';
import { profileService } from '@/lib/profile-service';
import {
  Calendar,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Package,
  Crown,
  Camera,
  MapPin,
  Clock,
  User,
  Globe,
  Image as ImageIcon,
  Video,
  Grid3x3,
  UserPlus
} from 'lucide-react';
import Image from 'next/image';
type ProfileData = import('@/lib/profile-service').ProfileData;

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  coverImage: string | null;
  createdAt: string | Date;
  location?: string | null;
  website?: string | null;
  birthdate?: string | null;
  phone?: string | null;
  email?: string | null;
  membershipPlan?: string | null;
}

interface SocialPost {
  id: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaUrls?: string | null;
  type: string;
  createdAt: string | Date;
  likes: { userId: string }[];
  comments: { id: string; content: string; user: { name: string; image: string } }[];
  author: { name: string; image: string; username: string };
}

interface SocialFriend {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  createdAt: string | Date;
}

type ViewerLike = { id: string } | null;

interface ProfessionalProfileProps {
  user: User;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  viewerLike: ViewerLike;
  posts: SocialPost[];
  friends: SocialFriend[];
  photos: SocialPost[];
  videos: SocialPost[];
  viewerId: string | null;
  isOwnProfile: boolean;
}

export default function ProfessionalProfile({
  user,
  followersCount,
  followingCount,
  likesCount,
  viewerLike,
  posts,
  friends,
  photos,
  videos,
  viewerId,
  isOwnProfile,
}: ProfessionalProfileProps) {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentLikesCount, setCurrentLikesCount] = useState<number>(likesCount);
  const [activeTab, setActiveTab] = useState<string>('posts');
  const [isLiked, setIsLiked] = useState<boolean>(!!viewerLike);

  const handleProfileUpdate = () => {
    // Force a page refresh to get updated data
    window.location.reload();
  };

  useEffect(() => {
    const unsubscribe = profileService.onProfileUpdate((p) => setProfileData(p));
    return unsubscribe;
  }, []);

  const displayData = profileData || {
    name: user.name,
    image: user.image,
    bio: user.bio,
    joinDate: (typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toISOString()),
  };

  const handleFollow = async () => {
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setIsFollowing(!!data.isFollowing);
      }
    } catch (e) {
      console.error('Failed to toggle follow:', e);
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch('/api/social/profile/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setIsLiked(!!data.isLiked);
        if (typeof data.likesCount === 'number') {
          setCurrentLikesCount(data.likesCount);
        }
      }
    } catch (e) {
      console.error('Failed to like profile:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Cover Photo Section */}
      <div className="relative h-80 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        {user.coverImage ? (
          <Image
            src={user.coverImage}
            alt="Cover"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Cover Photo Overlay Actions */}
        {isOwnProfile && (
          <div className="absolute top-4 right-4">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
            >
              <Camera className="h-4 w-4 mr-2" />
              Edit Cover
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Profile Header */}
      <div className="relative -mt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Enhanced Profile Picture */}
              <div className="relative">
                <div className="relative w-40 h-40">
                  <Image
                    src={displayData.image || '/api/placeholder/150/150'}
                    alt={displayData.name || 'Profile'}
                    fill
                    className="rounded-full border-4 border-white shadow-2xl object-cover"
                    sizes="160px"
                    priority
                  />

                  {/* Online Status Indicator */}
                  <div className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-white rounded-full shadow-lg">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-75" />
                  </div>

                  {/* Edit Button */}
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full p-2 h-10 w-10 bg-blue-600 hover:bg-blue-700 shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Enhanced Profile Details */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {displayData.name || 'Anonymous User'}
                      </h1>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          ONLINE
                        </Badge>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          Level {Math.floor((currentLikesCount || 0) / 100) + 1}
                        </Badge>
                        {user.membershipPlan && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                            {user.membershipPlan} Member
                          </Badge>
                        )}
                      </div>
                    </div>

                    {user.username && (
                      <p className="text-lg text-gray-600 mb-2">@{user.username}</p>
                    )}

                    {displayData.bio && (
                      <p className="text-gray-700 max-w-2xl leading-relaxed">{displayData.bio}</p>
                    )}

                    {/* Location/Status */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      {user.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Active 2 hours ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  {!isOwnProfile && viewerId && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className={`bg-gradient-to-r ${isFollowing
                          ? 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                          : 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                        } text-white shadow-lg`}
                        onClick={handleFollow}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>

                      <Button
                        variant="outline"
                        className="border-2 hover:bg-blue-50 hover:border-blue-300"
                        onClick={handleLike}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        {isLiked ? 'Liked' : 'Like'}
                      </Button>

                      <Button
                        variant="outline"
                        className="border-2 hover:bg-green-50 hover:border-green-300"
                        onClick={() => router.push(`/messages/${user.id}`)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>

                      <Button
                        variant="outline"
                        className="border-2 hover:bg-purple-50 hover:border-purple-300"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  )}

                  {/* Edit Profile Button for own profile */}
                  {isOwnProfile && (
                    <div className="flex gap-2">
                      <Button
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </div>

                {/* Enhanced Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{followersCount}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">{followingCount}</div>
                    <div className="text-sm text-gray-600">Following</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">{currentLikesCount}</div>
                    <div className="text-sm text-gray-600">Likes</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                    <div className="text-2xl font-bold text-orange-600">{posts.length}</div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              About
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Photos ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos ({videos.length})
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Recent Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {posts.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                      <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {post.imageUrl && (
                          <div className="relative h-48">
                            <Image
                              src={post.imageUrl}
                              alt="Post image"
                              fill
                              className="object-cover"
                              sizes="300px"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          {/* Author Information */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative w-8 h-8">
                              <Image
                                src={post.author.image || '/api/placeholder/32/32'}
                                alt={post.author.name || 'Author'}
                                fill
                                className="rounded-full object-cover cursor-pointer"
                                sizes="32px"
                                onClick={() => post.author.username && router.push(`/social/profile/${post.author.username}`)}
                              />
                            </div>
                            <div className="flex-1">
                              <p
                                className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => post.author.username && router.push(`/social/profile/${post.author.username}`)}
                              >
                                {post.author.name || 'Anonymous'}
                              </p>
                              {post.author.username && (
                                <p className="text-sm text-gray-500">@{post.author.username}</p>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-900 mb-3 line-clamp-3">{post.content}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{post.likes.length}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{post.comments.length}</span>
                              </div>
                            </div>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-blue-50 rounded-full w-fit mx-auto mb-4">
                      <Package className="h-12 w-12 text-blue-400" />
                    </div>
                    <p className="text-gray-600 text-lg">No posts yet</p>
                    <p className="text-gray-500 text-sm mt-1">Be the first to share something amazing!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  About {displayData.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {displayData.bio && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Bio</h3>
                    <p className="text-gray-700 leading-relaxed">{displayData.bio}</p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {displayData.joinDate && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Member since</p>
                        <p className="text-sm text-gray-600">{new Date(displayData.joinDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-full">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Location</p>
                        <p className="text-sm text-gray-600">{user.location}</p>
                      </div>
                    </div>
                  )}

                  {user.website && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Globe className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Website</p>
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {user.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {user.membershipPlan && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <Crown className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Membership</p>
                        <p className="text-sm text-gray-600">{user.membershipPlan} Plan</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Friends ({friends.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friends.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {friends.map((friend) => (
                      <Card key={friend.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => friend.username && router.push(`/social/profile/${friend.username}`)}>
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12">
                            <Image
                              src={friend.image || '/api/placeholder/50/50'}
                              alt={friend.name || 'Friend'}
                              fill
                              className="rounded-full object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 hover:text-blue-600 transition-colors">{friend.name}</p>
                            {friend.username && (
                              <p className="text-sm text-gray-500">@{friend.username}</p>
                            )}
                          </div>
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); }}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-green-50 rounded-full w-fit mx-auto mb-4">
                      <Users className="h-12 w-12 text-green-400" />
                    </div>
                    <p className="text-gray-600 text-lg">No friends yet</p>
                    <p className="text-gray-500 text-sm mt-1">Connect with others to build your network!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  Photos ({photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {photos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                        {photo.imageUrl ? (
                          <Image
                            src={photo.imageUrl}
                            alt="Photo"
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="200px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="relative w-6 h-6">
                                <Image
                                  src={photo.author.image || '/api/placeholder/24/24'}
                                  alt={photo.author.name || 'Author'}
                                  fill
                                  className="rounded-full object-cover cursor-pointer"
                                  sizes="24px"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (photo.author.username) {
                                      router.push(`/social/profile/${photo.author.username}`);
                                    }
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium cursor-pointer hover:text-blue-300 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (photo.author.username) {
                                        router.push(`/social/profile/${photo.author.username}`);
                                      }
                                    }}>
                                {photo.author.name || 'Anonymous'}
                              </span>
                            </div>
                            <Heart className="h-6 w-6 mx-auto mb-1" />
                            <span className="text-sm">{photo.likes.length} likes</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-purple-50 rounded-full w-fit mx-auto mb-4">
                      <ImageIcon className="h-12 w-12 text-purple-400" />
                    </div>
                    <p className="text-gray-600 text-lg">No photos yet</p>
                    <p className="text-gray-500 text-sm mt-1">Share your favorite moments!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  Videos ({videos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {videos.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video) => (
                      <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative aspect-video bg-gray-900">
                          {video.videoUrl ? (
                            <video
                              src={video.videoUrl}
                              className="w-full h-full object-cover"
                              controls
                              poster={video.coverUrl || undefined}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          {/* Author Information */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative w-8 h-8">
                              <Image
                                src={video.author.image || '/api/placeholder/32/32'}
                                alt={video.author.name || 'Author'}
                                fill
                                className="rounded-full object-cover cursor-pointer"
                                sizes="32px"
                                onClick={() => video.author.username && router.push(`/social/profile/${video.author.username}`)}
                              />
                            </div>
                            <div className="flex-1">
                              <p
                                className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => video.author.username && router.push(`/social/profile/${video.author.username}`)}
                              >
                                {video.author.name || 'Anonymous'}
                              </p>
                              {video.author.username && (
                                <p className="text-sm text-gray-500">@{video.author.username}</p>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-900 mb-3 line-clamp-2">{video.content}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{video.likes.length}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                <span>{video.comments.length}</span>
                              </div>
                            </div>
                            <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-red-50 rounded-full w-fit mx-auto mb-4">
                      <Video className="h-12 w-12 text-red-400" />
                    </div>
                    <p className="text-gray-600 text-lg">No videos yet</p>
                    <p className="text-gray-500 text-sm mt-1">Share your video content!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}
