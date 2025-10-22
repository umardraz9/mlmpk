'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from '@/hooks/useSession';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BackToDashboard from '@/components/BackToDashboard';

// Import optimized components
import { SocialPostCard } from '@/components/social/SocialPostCard';
import { SocialStats } from '@/components/social/SocialStats';
import { CreatePost } from '@/components/social/CreatePost';
import { SocialSidebar } from '@/components/social/SocialSidebar';

interface SocialPost {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    level: number;
    verified: boolean;
  };
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaUrls?: string[];
  type: 'achievement' | 'tip' | 'success' | 'general' | 'announcement' | 'reel';
  createdAt: Date;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
}

interface Stats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalMembers: number;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    level: number;
    verified: boolean;
  };
}

type FilterType = 'all' | 'achievement' | 'tip' | 'success' | 'general' | 'announcement';

export default function SocialPage() {
  const { data: session } = useSession();
  const uid = (session?.user as { id?: string })?.id;

  // State management
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalMembers: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'achievement' | 'tip' | 'success' | 'general' | 'announcement'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentsData, setCommentsData] = useState<Record<string, Comment[]>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  // Fetch posts with debounced search
  const fetchPosts = useCallback(async () => {
    if (!uid) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        limit: '20',
        type: activeFilter === 'all' ? '' : activeFilter,
        search: searchQuery
      });

      const response = await fetch(`/api/social/posts?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
        if (data.stats) {
          setStats({
            totalPosts: data.stats.totalPosts || 0,
            totalLikes: data.stats.totalLikes || 0,
            totalComments: data.stats.totalComments || 0,
            totalMembers: data.stats.totalMembers || 0
          });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [uid, activeFilter, searchQuery]);

  // Handle like functionality
  const handleLike = useCallback(async (postId: string) => {
    try {
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf-token='))?.split('=')[1];

      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken || '' }
      });

      const data = await response.json();

      if (data.success) {
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: data.isLiked,
                likes: data.likesCount,
                recentLikes: data.recentLikes || []
              }
            : post
        ));
        setSuccess(data.message);
      } else {
        setError(data.error || 'Failed to toggle like');
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to toggle like');
    }
  }, []);

  // Handle comment functionality
  const handleComment = useCallback(async (postId: string) => {
    // For now, just show/hide comments section
    // TODO: Implement comment modal or inline comment form
    console.log('Comment on post:', postId);
  }, []);

  // Handle share functionality
  const handleShare = useCallback(async (post: SocialPost) => {
    try {
      const url = `${window.location.origin}/social?post=${post.id}`;

      if (navigator.share) {
        await navigator.share({
          title: `${post.author?.name || 'MLM-Pak'} on MLM-Pak`,
          text: post.content?.slice(0, 120) || 'Check out this post on MLM-Pak',
          url,
        });
        setSuccess('Post shared');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setSuccess('Link copied to clipboard');
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setSuccess('Link copied to clipboard');
      }
    } catch (e) {
      console.error('Share failed', e);
      setError('Unable to share right now');
    }
  }, []);

  // Handle load comments
  const handleLoadComments = useCallback(async (postId: string) => {
    if (commentsData[postId]) {
      setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
      return;
    }

    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`);
      const data = await response.json();

      if (data.success) {
        setCommentsData(prev => ({ ...prev, [postId]: data.comments }));
        setShowComments(prev => ({ ...prev, [postId]: true }));
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments');
    }
  }, [commentsData]);

  // Handle create post
  const handleCreatePost = useCallback(async (content: string, type: string, mediaFiles?: File[]) => {
    if (!uid) return;

    try {
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf-token='))?.split('=')[1];

      const formData = new FormData();
      formData.append('content', content);
      formData.append('type', type);

      // Add media files if provided
      if (mediaFiles && mediaFiles.length > 0) {
        console.log(`Uploading ${mediaFiles.length} files:`, mediaFiles.map(f => f.name));
        mediaFiles.forEach((file, index) => {
          formData.append(`media-${index}`, file);
          console.log(`Appended file ${index}: ${file.name} (${file.size} bytes)`);
        });
      }

      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken || '' },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to create post');
      }

      // Prepend new post to the list
      setPosts(prev => [data.post, ...prev]);
      setSuccess('Post created successfully!');

      // Refresh stats
      fetchPosts();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create post';
      setError(message);
      throw e;
    }
  }, [uid, fetchPosts]);

  // Load data on mount and filter change
  useEffect(() => {
    if (uid) {
      fetchPosts();
    }
  }, [uid, activeFilter, searchQuery, fetchPosts]);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600">Please sign in to access the social page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="container mx-auto px-4 py-8">
        {success && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {success}
          </div>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8 text-center">
          <BackToDashboard />
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            MCNmart.com Social
          </h1>
          <p className="text-xl text-gray-700">
            Connect, share, and grow with your MCNmart.com community
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Overview */}
            <Suspense fallback={<div className="animate-pulse bg-white rounded-lg h-32"></div>}>
              <SocialStats stats={stats} isLoading={loading} />
            </Suspense>

            {/* Create Post */}
            <Suspense fallback={<div className="animate-pulse bg-white rounded-lg h-40"></div>}>
              <CreatePost
                onCreatePost={handleCreatePost}
                userName={session?.user?.name || 'You'}
                userAvatar={session?.user?.image || '/api/placeholder/50/50'}
                isLoading={loading}
              />
            </Suspense>

            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={activeFilter} onValueChange={(value: FilterType) => setActiveFilter(value)}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Posts</SelectItem>
                    <SelectItem value="achievement">Achievements</SelectItem>
                    <SelectItem value="tip">Tips</SelectItem>
                    <SelectItem value="success">Success Stories</SelectItem>
                    <SelectItem value="announcement">Announcements</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {loading ? (
                // Loading skeleton
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border p-6 animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : posts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'No posts found matching your search.' : 'No posts yet. Be the first to share!'}
                </p>
              ) : (
                posts.map(post => (
                  <Suspense key={post.id} fallback={<div className="animate-pulse bg-white rounded-lg h-64"></div>}>
                    <SocialPostCard
                      post={post}
                      onLike={handleLike}
                      onComment={handleComment}
                      onShare={handleShare}
                      onLoadComments={handleLoadComments}
                      showComments={showComments[post.id]}
                    />
                  </Suspense>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Suspense fallback={<div className="animate-pulse space-y-6">
              <div className="bg-white rounded-lg h-64"></div>
              <div className="bg-white rounded-lg h-96"></div>
            </div>}>
              <SocialSidebar isLoading={loading} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
