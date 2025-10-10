import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

import { CreatePost } from './CreatePost';
import { FriendSuggestions } from './FriendSuggestions';
import { ReelsSuggestions } from './ReelsSuggestions';

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Lazy load heavy components
const FacebookPostCard = dynamic(() => import('./FacebookPostCard'), {
  loading: () => <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
});

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

interface OptimizedRealTimeFeedProps {
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (post: FacebookPost) => void;
}

const OptimizedRealTimeFeed = React.memo(function OptimizedRealTimeFeed({ 
  onLike, 
  onComment, 
  onShare 
}: OptimizedRealTimeFeedProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState(10);
  const [touchStartY, setTouchStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  // Memoized fetch function with SWR pattern
  const fetchPosts = useCallback(async (silent = false) => {
    if (!session?.user) return;
    try {
      if (!silent) setLoading(true);
      setError('');

      // Check cache first
      const userId = (session.user as ExtendedUser).id || 'anonymous';
      const cacheKey = `social-posts-${userId}`;
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = parseInt(sessionStorage.getItem(`${cacheKey}-time`) || '0');
      const now = Date.now();

      if (cached && (now - cacheTime < 30000)) {
        const cachedData = JSON.parse(cached);
        setPosts(cachedData);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/social/posts?limit=20', {
        headers: {
          'Cache-Control': 'max-age=30'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const newPosts = data.posts || [];
        
        // Cache the response
        sessionStorage.setItem(cacheKey, JSON.stringify(newPosts));
        sessionStorage.setItem(`${cacheKey}-time`, now.toString());

        if (newPosts.length > 0) {
          setPosts(prev => {
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
      setLoading(false);
    }
  }, [session?.user]);

  // Memoized handlers
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

  // Pull-to-refresh functionality
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;

      if (distance > 0 && distance < 100) {
        setPullDistance(distance);
        e.preventDefault();
      }
    }
  }, [touchStartY]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60) {
      setRefreshing(true);
      await fetchPosts(true);
      setRefreshing(false);
    }

    setTouchStartY(0);
    setPullDistance(0);
  }, [pullDistance, fetchPosts]);

  const handleCreatePost = useCallback(async (content: string, type: string, mediaFiles?: File[]) => {
    if (!session?.user) return;

    try {
      setIsCreatingPost(true);

      // Send FormData for file uploads or JSON for text-only posts
      let response: Response;

      if (mediaFiles && mediaFiles.length > 0) {
        const formData = new FormData();
        formData.append('content', content.trim());
        formData.append('type', type);

        // Add media files with correct naming pattern (media-{index})
        mediaFiles.forEach((file, index) => {
          formData.append(`media-${index}`, file);
        });

        console.log(`Uploading ${mediaFiles.length} files to API:`, mediaFiles.map(f => f.name));

        response = await fetch('/api/social/posts', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Send JSON for text-only posts
        const postData = {
          content: content.trim(),
          type: type,
        };

        response = await fetch('/api/social/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }

      const data = await response.json();

      if (data.success) {
        // Refresh posts to show the new post
        await fetchPosts(true);

        // Show success message
        console.log('Post created successfully:', data.message);
      }
    } catch (err) {
      // Show user-friendly error message
      console.error('Error creating post:', err);
      throw err;
    } finally {
      setIsCreatingPost(false);
    }
  }, [session?.user, fetchPosts]);

  // Initial load
  useEffect(() => {
    if (session?.user) {
      fetchPosts();
    }
  }, [session?.user, fetchPosts]);

  const loadMorePosts = useCallback(() => {
    // Calculate how many posts to add based on current visible count
    // Since we insert discovery content after every 5 posts, we need to show more posts
    // to maintain the same visual density
    const postsPerBatch = 10;
    const discoveryInsertions = Math.floor(postsPerBatch / 5);
    const totalToShow = postsPerBatch + discoveryInsertions;

    setVisiblePosts(prev => Math.min(prev + totalToShow, posts.length));
  }, [posts.length]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPosts]);

  // Refresh on scroll to top (when user is at top of page)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY === 0) {
        const lastRefresh = sessionStorage.getItem('lastScrollRefresh');
        const now = Date.now();
        if (!lastRefresh || now - parseInt(lastRefresh) > 10000) {
          fetchPosts(true);
          sessionStorage.setItem('lastScrollRefresh', now.toString());
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchPosts]);

  // Memoized visible posts for virtualization with discovery content
  const displayedPosts = useMemo(() => {
    const postsWithDiscovery: (FacebookPost | { id: string; type: string; component: React.ComponentType })[] = [];
    const postsToShow = posts.slice(0, visiblePosts);

    for (let i = 0; i < postsToShow.length; i++) {
      postsWithDiscovery.push(postsToShow[i]);

      // Insert discovery content after every 5 posts
      // Alternate between friend suggestions and reels
      if ((i + 1) % 5 === 0 && i < postsToShow.length - 1) {
        const insertionNumber = Math.floor((i + 1) / 5);
        const isEven = insertionNumber % 2 === 0;
        
        postsWithDiscovery.push({
          id: `discovery-${i}`,
          type: isEven ? 'reels' : 'friends',
          component: isEven ? ReelsSuggestions : FriendSuggestions
        });
      }
    }

    return postsWithDiscovery;
  }, [posts, visiblePosts]);

  return (
    <div
      className="space-y-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div className="flex justify-center py-4">
          <div className={`flex items-center space-x-2 text-blue-600 ${pullDistance > 60 ? 'text-green-600' : ''}`}>
            {refreshing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : (
              <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${pullDistance > 60 ? 'border-green-600' : 'border-blue-600'}`}></div>
            )}
            <span className="text-sm font-medium">
              {refreshing ? 'Refreshing...' : (pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh')}
            </span>
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading posts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-red-200">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchPosts()}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Posts Feed with Virtualization */}
      {!loading && !error && (
        <div className="space-y-6">
          {displayedPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

              // This is a regular FacebookPost
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
        </div>
      )}

      {/* Load More Button */}
      {!loading && posts.length > visiblePosts && (
        <div className="text-center">
          <button
            onClick={loadMorePosts}
            className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
          >
            Load More Content ({posts.length - visiblePosts} posts remaining)
          </button>
        </div>
      )}
    </div>
  );
});

export default OptimizedRealTimeFeed;
