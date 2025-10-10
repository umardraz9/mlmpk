'use client';

import { useEffect, useCallback, useState } from 'react';
import { indexedDBManager } from '@/lib/IndexedDBManager';

/**
 * Advanced Cache Hook - Facebook-style preloading and caching
 * Combines IndexedDB, Service Worker, and predictive prefetching
 */

interface CacheStats {
  posts: number;
  images: number;
  pendingActions: number;
  serviceWorkerActive: boolean;
}

export function useAdvancedCache() {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    posts: 0,
    images: 0,
    pendingActions: 0,
    serviceWorkerActive: false,
  });

  /**
   * Initialize Service Worker
   */
  const initServiceWorker = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      if (registration.installing) {
        console.log('📦 Service Worker installing...');
      } else if (registration.waiting) {
        console.log('⏳ Service Worker waiting...');
      } else if (registration.active) {
        console.log('✅ Service Worker active');
      }

      // Update cache stats
      setCacheStats((prev) => ({ ...prev, serviceWorkerActive: true }));

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }, []);

  /**
   * Cache posts with predictive prefetching
   */
  const cachePosts = useCallback(async (posts: any[]) => {
    try {
      // Store posts in IndexedDB (1 hour TTL)
      await indexedDBManager.cachePosts(posts, 3600);

      // Prefetch images in background
      indexedDBManager.prefetchPostImages(posts);

      // Update stats
      updateCacheStats();

      console.log(`💾 Cached ${posts.length} posts with images`);
    } catch (error) {
      console.error('Error caching posts:', error);
    }
  }, []);

  /**
   * Get cached posts (instant load)
   */
  const getCachedPosts = useCallback(async (limit: number = 20): Promise<any[]> => {
    try {
      const cached = await indexedDBManager.getCachedPosts(limit);
      console.log(`📥 Retrieved ${cached.length} cached posts`);
      return cached;
    } catch (error) {
      console.error('Error getting cached posts:', error);
      return [];
    }
  }, []);

  /**
   * Prefetch next batch of posts (predictive loading)
   */
  const prefetchNextPosts = useCallback(async (currentPage: number) => {
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(`/api/social/posts?page=${nextPage}&limit=15`, {
        headers: { 'Cache-Control': 'max-age=300' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.posts) {
          // Cache prefetched posts
          await indexedDBManager.cachePosts(data.posts, 1800); // 30min TTL
          indexedDBManager.prefetchPostImages(data.posts);
          console.log(`🔮 Prefetched page ${nextPage} (${data.posts.length} posts)`);
        }
      }
    } catch (error) {
      console.error('Error prefetching posts:', error);
    }
  }, []);

  /**
   * Cache image from URL
   */
  const cacheImage = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        await indexedDBManager.cacheImage(url, blob);
        console.log('🖼️ Image cached:', url);
      }
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }, []);

  /**
   * Get cached image as blob URL
   */
  const getCachedImage = useCallback(async (url: string): Promise<string | null> => {
    try {
      const blob = await indexedDBManager.getCachedImage(url);
      if (blob) {
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error('Error getting cached image:', error);
    }
    return null;
  }, []);

  /**
   * Save action for background sync (offline support)
   */
  const saveOfflineAction = useCallback(
    async (action: { type: 'like' | 'comment' | 'post' | 'share'; data: any }) => {
      try {
        await indexedDBManager.addPendingAction(action);
        console.log('📤 Offline action saved:', action.type);
      } catch (error) {
        console.error('Error saving offline action:', error);
      }
    },
    []
  );

  /**
   * Sync pending actions when back online
   */
  const syncPendingActions = useCallback(async () => {
    try {
      const pendingActions = await indexedDBManager.getPendingActions();

      if (pendingActions.length === 0) {
        return;
      }

      console.log(`🔄 Syncing ${pendingActions.length} pending actions...`);

      for (const action of pendingActions) {
        try {
          // Execute action based on type
          switch (action.type) {
            case 'like':
              await fetch(`/api/social/posts/${action.data.postId}/like`, {
                method: 'POST',
              });
              break;
            case 'comment':
              await fetch(`/api/social/posts/${action.data.postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: action.data.content }),
              });
              break;
            case 'post':
              await fetch('/api/social/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(action.data),
              });
              break;
          }

          // Remove synced action
          await indexedDBManager.removePendingAction(action.id);
          console.log('✅ Synced action:', action.type);
        } catch (error) {
          console.error('Failed to sync action:', action.type, error);
        }
      }

      updateCacheStats();
    } catch (error) {
      console.error('Error syncing pending actions:', error);
    }
  }, []);

  /**
   * Update cache statistics
   */
  const updateCacheStats = useCallback(async () => {
    try {
      const stats = await indexedDBManager.getCacheStats();
      const swActive = !!(navigator.serviceWorker && (await navigator.serviceWorker.ready));

      setCacheStats({
        posts: stats.posts,
        images: stats.images,
        pendingActions: stats.pendingActions,
        serviceWorkerActive: swActive,
      });
    } catch (error) {
      console.error('Error updating cache stats:', error);
    }
  }, []);

  /**
   * Clear expired cache
   */
  const clearExpiredCache = useCallback(async () => {
    try {
      await indexedDBManager.clearExpiredCache();
      updateCacheStats();
      console.log('🗑️ Expired cache cleared');
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }, [updateCacheStats]);

  /**
   * Clear all cache
   */
  const clearAllCache = useCallback(async () => {
    try {
      await indexedDBManager.clearAll();
      updateCacheStats();
      console.log('🗑️ All cache cleared');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }, [updateCacheStats]);

  /**
   * Get network quality for adaptive loading
   */
  const getNetworkQuality = useCallback((): 'fast' | 'slow' | 'offline' => {
    if (!navigator.onLine) return 'offline';

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;

      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return 'slow';
      }
    }

    return 'fast';
  }, []);

  // Initialize on mount
  useEffect(() => {
    initServiceWorker();
    updateCacheStats();

    // Clear expired cache on mount
    clearExpiredCache();

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('🌐 Back online - syncing pending actions...');
      syncPendingActions();
    };

    const handleOffline = () => {
      console.log('📡 Offline - actions will be queued');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initServiceWorker, updateCacheStats, clearExpiredCache, syncPendingActions]);

  return {
    // Cache operations
    cachePosts,
    getCachedPosts,
    prefetchNextPosts,
    cacheImage,
    getCachedImage,

    // Offline support
    saveOfflineAction,
    syncPendingActions,

    // Cache management
    clearExpiredCache,
    clearAllCache,
    updateCacheStats,

    // Network info
    getNetworkQuality,

    // Stats
    cacheStats,
  };
}

/**
 * Hook for predictive prefetching based on user behavior
 */
export function usePredictivePrefetch() {
  const { prefetchNextPosts } = useAdvancedCache();
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;

          // Prefetch next page when 70% down the current page
          const scrollPercentage = (scrollPosition + windowHeight) / documentHeight;

          if (scrollPercentage > 0.7 && scrollPosition > lastScrollPosition) {
            console.log('🔮 Predictive prefetch triggered');
            prefetchNextPosts(currentPage);
            setCurrentPage((prev) => prev + 1);
          }

          setLastScrollPosition(scrollPosition);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollPosition, currentPage, prefetchNextPosts]);
}
