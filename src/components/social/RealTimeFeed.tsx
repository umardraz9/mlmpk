'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import FacebookPostCard from './FacebookPostCard';

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

interface FacebookPost {
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
  coverUrl?: string;
  type: 'achievement' | 'tip' | 'success' | 'general' | 'announcement' | 'reel';
  createdAt: Date;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  recentLikes?: Array<{
    userId: string;
    name: string;
    avatar: string;
  }>;
  recentComments?: Comment[];
}

interface RealTimeFeedProps {
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (post: FacebookPost) => void;
}

export default function RealTimeFeed({ onLike, onComment, onShare }: RealTimeFeedProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const fetchPosts = useCallback(async (silent = false) => {
    if (!session?.user) return;

    try {
      if (!silent) setLoading(true);
      setError('');

      // Fetch latest posts (server paginates and sorts desc)
      const response = await fetch('/api/social/posts?limit=20');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const newPosts = data.posts || [];

        if (newPosts.length > 0) {
          // Merge, dedupe, and compute new post count based on previous state
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const trulyNewPosts = newPosts.filter((post: FacebookPost) => !existingIds.has(post.id));
            if (trulyNewPosts.length > 0) {
              setNewPostsCount(prevCount => prevCount + trulyNewPosts.length);
            }

            const merged = [...newPosts, ...prev];
            const unique = merged.filter((post, index, self) =>
              index === self.findIndex(p => p.id === post.id)
            );
            return unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      if (!silent) setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      // Always clear loading, even for silent refreshes, so UI doesn't get stuck
      setLoading(false);
    }
  }, [session?.user]);

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
                likes: data.likesCount
              }
            : post
        ));

        onLike?.(postId);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  }, [onLike]);

  const handleComment = useCallback(async (postId: string, content: string) => {
    try {
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf-token='))?.split('=')[1];

      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      if (data.success) {
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? {
                ...post,
                comments: data.meta.totalComments,
                recentComments: [data.comment, ...(post.recentComments || []).slice(0, 2)]
              }
            : post
        ));

        onComment?.(postId, content);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  }, [onComment]);

  const handleShare = useCallback(async (post: FacebookPost) => {
    try {
      const url = `${window.location.origin}/social?post=${post.id}`;

      if (navigator.share) {
        await navigator.share({
          title: `${post.author.name} on MLM-Pak`,
          text: post.content.slice(0, 120),
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard');
      }

      onShare?.(post);
    } catch (e) {
      console.error('Share failed', e);
    }
  }, [onShare]);

  const showNewPosts = () => {
    setNewPostsCount(0);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-refresh posts every 30 seconds
  useEffect(() => {
    if (!session?.user || !isAutoRefresh) return;

    const interval = setInterval(() => {
      fetchPosts(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [session?.user, isAutoRefresh, fetchPosts]);

  // Initial load
  useEffect(() => {
    if (session?.user) {
      fetchPosts();
    }
  }, [session?.user, fetchPosts]);

  return (
    <div className="space-y-4">
      {/* Real-time status indicator */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isAutoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isAutoRefresh ? 'Live updates enabled' : 'Live updates paused'}
          </span>
        </div>
        <button
          onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {isAutoRefresh ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* New posts indicator */}
      {newPostsCount > 0 && (
        <div className="sticky top-0 z-40 bg-blue-600 text-white p-3 rounded-lg shadow-lg text-center">
          <p className="font-medium">{newPostsCount} new post{newPostsCount > 1 ? 's' : ''} available</p>
          <button
            onClick={showNewPosts}
            className="mt-2 bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Show new posts
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchPosts()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Posts Feed */}
      {!loading && !error && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-4">Be the first to share something with the community!</p>
              <button
                onClick={() => document.querySelector('textarea')?.focus()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <FacebookPostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
              />
            ))
          )}
        </div>
      )}

      {/* Load More Button */}
      {!loading && posts.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => fetchPosts()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors"
          >
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
}
