import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useEventSource } from '@/lib/EventSourceManager';
import { debounce, throttle } from '@/lib/performance-utils';
import { useAdvancedCache, usePredictivePrefetch } from '@/hooks/useAdvancedCache';

import { CreatePost } from './CreatePost';
import { FriendSuggestions } from './FriendSuggestions';
import { ReelsSuggestions } from './ReelsSuggestions';

// Lazy load heavy components with better loading states
const FacebookPostCard = dynamic(() => import('./FacebookPostCard'), {
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse h-64">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  ),
  ssr: false,
});

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
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
  isSaved?: boolean;
  isPinned?: boolean;
  recentLikes?: Array<{
    userId: string;
    name: string;
    avatar: string;
  }>;
  recentComments?: Comment[];
}

interface VirtualizedFeedProps {
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (post: FacebookPost) => void;
}

const VirtualizedFeed = React.memo(function VirtualizedFeed({
  onLike,
  onComment,
  onShare,
}: VirtualizedFeedProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  
  // Advanced caching hooks
  const { 
    cachePosts, 
    getCachedPosts, 
    saveOfflineAction,
    getNetworkQuality,
    cacheStats 
  } = useAdvancedCache();
  
  // Predictive prefetching
  usePredictivePrefetch();

  // Cache management
  const cacheKey = useMemo(() => {
    const userId = (session?.user as ExtendedUser)?.id || 'anonymous';
    return `social-posts-v2-${userId}`;
  }, [session?.user]);

  // Optimized fetch function with advanced caching
  const fetchPosts = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!session?.user) return;

      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        setError('');

        // Try IndexedDB cache first for instant load (first page only)
        if (pageNum === 1 && !append) {
          const cachedPosts = await getCachedPosts(20);
          if (cachedPosts.length > 0) {
            setPosts(cachedPosts);
            setLoading(false);
            console.log('⚡ Instant load from IndexedDB cache');
            
            // Fetch fresh data in background
            fetchFreshPosts(pageNum, false);
            return;
          }
        }

        const response = await fetch(`/api/social/posts?page=${pageNum}&limit=15`, {
          headers: { 'Cache-Control': 'max-age=60' },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          const newPosts = data.posts || [];

          if (newPosts.length < 15) {
            setHasMore(false);
          }

          if (append) {
            setPosts((prev) => {
              const merged = [...prev, ...newPosts];
              const unique = merged.filter(
                (post, index, self) => index === self.findIndex((p) => p.id === post.id)
              );
              return unique;
            });
          } else {
            setPosts(newPosts);
          }
          
          // Cache posts in IndexedDB with prefetching
          if (pageNum === 1) {
            await cachePosts(newPosts);
            console.log('💾 Posts cached with image prefetching');
          }
        } else {
          throw new Error(data.error || 'Failed to fetch posts');
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        if (!append) setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [session?.user, getCachedPosts, cachePosts]
  );
  
  // Fetch fresh posts in background (for cache refresh)
  const fetchFreshPosts = useCallback(
    async (pageNum: number, silent: boolean = true) => {
      try {
        const response = await fetch(`/api/social/posts?page=${pageNum}&limit=15`, {
          headers: { 'Cache-Control': 'max-age=60' },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.posts) {
            setPosts(data.posts);
            await cachePosts(data.posts);
            if (!silent) console.log('🔄 Fresh posts loaded');
          }
        }
      } catch (error) {
        console.error('Background refresh failed:', error);
      }
    },
    [cachePosts]
  );

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore]);

  // Fetch more posts when page changes
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page, true);
    }
  }, [page, fetchPosts]);

  // Initial load
  useEffect(() => {
    if (session?.user) {
      fetchPosts(1, false);
    }
  }, [session?.user, fetchPosts]);

  // Real-time updates via EventSource
  useEventSource(
    'post',
    useCallback(
      (payload: any) => {
        if (payload?.data?.action === 'new_post') {
          // Invalidate cache and refetch
          sessionStorage.removeItem(cacheKey);
          fetchPosts(1, false);
        }
      },
      [cacheKey, fetchPosts]
    )
  );

  // Optimized handlers with offline support
  const handleLike = useCallback(
    async (postId: string) => {
      // Optimistic update
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              }
            : post
        )
      );

      try {
        // Check if online
        if (!navigator.onLine) {
          await saveOfflineAction({ type: 'like', data: { postId } });
          console.log('📤 Like queued for sync');
          return;
        }

        const csrfToken = document.cookie
          .split('; ')
          .find((row) => row.startsWith('csrf-token='))
          ?.split('=')[1];

        const response = await fetch(`/api/social/posts/${postId}/like`, {
          method: 'POST',
          headers: { 'x-csrf-token': csrfToken || '' },
        });

        const data = await response.json();

        if (data.success) {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    isLiked: data.isLiked,
                    likes: data.likesCount,
                  }
                : post
            )
          );

          onLike?.(postId);
        }
      } catch (err) {
        console.error('Error toggling like:', err);
        // Revert optimistic update on error
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !post.isLiked,
                  likes: post.isLiked ? post.likes + 1 : post.likes - 1,
                }
              : post
          )
        );
      }
    },
    [onLike, saveOfflineAction]
  );

  const handleComment = useCallback(
    async (postId: string, content: string) => {
      try {
        // Check if online
        if (!navigator.onLine) {
          await saveOfflineAction({ type: 'comment', data: { postId, content } });
          console.log('📤 Comment queued for sync');
          alert('You are offline. Comment will be posted when back online.');
          return;
        }

        const csrfToken = document.cookie
          .split('; ')
          .find((row) => row.startsWith('csrf-token='))
          ?.split('=')[1];

        const response = await fetch(`/api/social/posts/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken || '',
          },
          body: JSON.stringify({ content }),
        });

        const data = await response.json();

        if (data.success) {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    comments: data.meta.totalComments,
                    recentComments: [data.comment, ...(post.recentComments || []).slice(0, 2)],
                  }
                : post
            )
          );

          onComment?.(postId, content);
        }
      } catch (err) {
        console.error('Error adding comment:', err);
      }
    },
    [onComment, saveOfflineAction]
  );

  const handleShare = useCallback(
    async (post: FacebookPost) => {
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
    },
    [onShare]
  );

  const handleCreatePost = useCallback(
    async (content: string, type: string, mediaFiles?: File[]) => {
      if (!session?.user) return;

      try {
        setIsCreatingPost(true);

        // Check if online
        if (!navigator.onLine) {
          await saveOfflineAction({ 
            type: 'post', 
            data: { content: content.trim(), type } 
          });
          alert('You are offline. Post will be published when back online.');
          setIsCreatingPost(false);
          return;
        }

        let response: Response;

        if (mediaFiles && mediaFiles.length > 0) {
          const formData = new FormData();
          formData.append('content', content.trim());
          formData.append('type', type);

          mediaFiles.forEach((file, index) => {
            formData.append(`media-${index}`, file);
          });

          response = await fetch('/api/social/posts', {
            method: 'POST',
            body: formData,
          });
        } else {
          response = await fetch('/api/social/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content.trim(), type }),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create post');
        }

        const data = await response.json();

        if (data.success) {
          // Refetch and update cache
          await fetchPosts(1, false);
          console.log('Post created successfully');
        }
      } catch (err) {
        console.error('Error creating post:', err);
        throw err;
      } finally {
        setIsCreatingPost(false);
      }
    },
    [session?.user, fetchPosts, saveOfflineAction]
  );

  // Render posts with discovery content
  const displayedPosts = useMemo(() => {
    const postsWithDiscovery: (FacebookPost | { id: string; type: string; component: React.ComponentType })[] = [];

    for (let i = 0; i < posts.length; i++) {
      postsWithDiscovery.push(posts[i]);

      if ((i + 1) % 5 === 0 && i < posts.length - 1) {
        const insertionNumber = Math.floor((i + 1) / 5);
        const isEven = insertionNumber % 2 === 0;

        postsWithDiscovery.push({
          id: `discovery-${i}`,
          type: isEven ? 'reels' : 'friends',
          component: isEven ? ReelsSuggestions : FriendSuggestions,
        });
      }
    }

    return postsWithDiscovery;
  }, [posts]);

  // Network quality indicator
  const networkQuality = getNetworkQuality();

  return (
    <div className="space-y-6">
      {/* Network Status Banner */}
      {networkQuality === 'offline' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">You&apos;re offline</p>
              <p className="text-sm text-yellow-700">
                Browsing cached content. Actions will sync when back online. 
                {cacheStats.pendingActions > 0 && ` (${cacheStats.pendingActions} pending)`}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Cache Status (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-900">Cache Status:</span>
            <div className="flex gap-4 text-blue-700">
              <span>📦 {cacheStats.posts} posts</span>
              <span>🖼️ {cacheStats.images} images</span>
              <span>📤 {cacheStats.pendingActions} pending</span>
              <span>{cacheStats.serviceWorkerActive ? '✅ SW' : '❌ SW'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Section */}
      {session?.user && (
        <CreatePost
          onCreatePost={handleCreatePost}
          userName={session.user.name || 'You'}
          userAvatar={session.user.image || ''}
          isLoading={isCreatingPost}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading posts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-red-200">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchPosts(1, false)}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Posts Feed */}
      {!loading && !error && (
        <div className="space-y-6">
          {displayedPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No posts yet</h3>
              <p className="text-gray-600 mb-6 text-lg">Be the first to share something with the community!</p>
              <button
                onClick={() => document.querySelector('textarea')?.focus()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Create First Post
              </button>
            </div>
          ) : (
            displayedPosts.map((item) => {
              if ('type' in item && (item.type === 'friends' || item.type === 'reels')) {
                const DiscoveryComponent = item.component;
                return <DiscoveryComponent key={item.id} />;
              }

              return (
                <FacebookPostCard
                  key={item.id}
                  post={item as FacebookPost}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                />
              );
            })
          )}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="py-4">
              {loadingMore && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default VirtualizedFeed;
