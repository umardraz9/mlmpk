/**
 * IndexedDB Manager - Facebook-style persistent caching
 * Stores posts, images, and user data in browser's IndexedDB
 * Survives page refresh and works offline
 */

const DB_NAME = 'mlmpak-social-cache';
const DB_VERSION = 1;

interface CacheEntry<T> {
  id: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PostCache {
  id: string;
  content: string;
  author: any;
  media?: string[];
  likes: number;
  comments: number;
  timestamp: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  /**
   * Initialize IndexedDB with object stores
   */
  private async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Posts store
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
          postsStore.createIndex('timestamp', 'timestamp', { unique: false });
          postsStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Images store (blob data)
        if (!db.objectStoreNames.contains('images')) {
          const imagesStore = db.createObjectStore('images', { keyPath: 'id' });
          imagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // User profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          const profilesStore = db.createObjectStore('profiles', { keyPath: 'id' });
          profilesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Pending actions store (for background sync)
        if (!db.objectStoreNames.contains('pendingActions')) {
          db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
        }

        console.log('📦 IndexedDB stores created');
      };
    });
  }

  /**
   * Ensure DB is initialized before operations
   */
  private async ensureInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Store posts in IndexedDB
   */
  async cachePosts(posts: any[], ttlSeconds: number = 3600): Promise<void> {
    await this.ensureInit();
    if (!this.db) return;

    const transaction = this.db.transaction(['posts'], 'readwrite');
    const store = transaction.objectStore('posts');

    const now = Date.now();
    const expiresAt = now + (ttlSeconds * 1000);

    for (const post of posts) {
      const cacheEntry: CacheEntry<any> = {
        id: post.id,
        data: post,
        timestamp: now,
        expiresAt,
      };

      try {
        await new Promise((resolve, reject) => {
          const request = store.put(cacheEntry);
          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('Error caching post:', error);
      }
    }

    console.log(`💾 Cached ${posts.length} posts in IndexedDB`);
  }

  /**
   * Get cached posts from IndexedDB
   */
  async getCachedPosts(limit: number = 20): Promise<any[]> {
    await this.ensureInit();
    if (!this.db) return [];

    const transaction = this.db.transaction(['posts'], 'readonly');
    const store = transaction.objectStore('posts');
    const index = store.index('timestamp');

    return new Promise((resolve) => {
      const posts: any[] = [];
      const now = Date.now();

      const request = index.openCursor(null, 'prev'); // Newest first

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor && posts.length < limit) {
          const entry: CacheEntry<any> = cursor.value;

          // Check if not expired
          if (entry.expiresAt > now) {
            posts.push(entry.data);
          } else {
            // Delete expired entry
            store.delete(entry.id);
          }

          cursor.continue();
        } else {
          resolve(posts);
        }
      };

      request.onerror = () => {
        console.error('Error reading cached posts');
        resolve([]);
      };
    });
  }

  /**
   * Cache image blob for offline access
   */
  async cacheImage(url: string, blob: Blob): Promise<void> {
    await this.ensureInit();
    if (!this.db) return;

    const transaction = this.db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');

    const imageEntry = {
      id: url,
      blob: blob,
      timestamp: Date.now(),
    };

    try {
      await new Promise((resolve, reject) => {
        const request = store.put(imageEntry);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
      console.log('🖼️ Image cached:', url);
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  /**
   * Get cached image blob
   */
  async getCachedImage(url: string): Promise<Blob | null> {
    await this.ensureInit();
    if (!this.db) return null;

    const transaction = this.db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');

    return new Promise((resolve) => {
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };

      request.onerror = () => {
        console.error('Error getting cached image');
        resolve(null);
      };
    });
  }

  /**
   * Prefetch and cache images from posts
   */
  async prefetchPostImages(posts: any[]): Promise<void> {
    const imageUrls = new Set<string>();

    // Collect all image URLs
    posts.forEach((post) => {
      if (post.imageUrl) imageUrls.add(post.imageUrl);
      if (post.coverUrl) imageUrls.add(post.coverUrl);
      if (post.mediaUrls) {
        post.mediaUrls.forEach((url: string) => imageUrls.add(url));
      }
      if (post.author?.avatar) imageUrls.add(post.author.avatar);
    });

    // Prefetch images in background
    const prefetchPromises = Array.from(imageUrls).map(async (url) => {
      try {
        // Check if already cached
        const cached = await this.getCachedImage(url);
        if (cached) return;

        // Fetch and cache
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          await this.cacheImage(url, blob);
        }
      } catch (error) {
        console.error('Error prefetching image:', url, error);
      }
    });

    // Don't wait for all to complete (background operation)
    Promise.all(prefetchPromises).then(() => {
      console.log(`🖼️ Prefetched ${imageUrls.size} images`);
    });
  }

  /**
   * Store pending action for background sync (e.g., like, comment when offline)
   */
  async addPendingAction(action: {
    type: 'like' | 'comment' | 'post' | 'share';
    data: any;
  }): Promise<void> {
    await this.ensureInit();
    if (!this.db) return;

    const transaction = this.db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');

    const actionEntry = {
      ...action,
      timestamp: Date.now(),
    };

    await new Promise((resolve, reject) => {
      const request = store.add(actionEntry);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });

    console.log('📤 Pending action stored:', action.type);
  }

  /**
   * Get all pending actions
   */
  async getPendingActions(): Promise<any[]> {
    await this.ensureInit();
    if (!this.db) return [];

    const transaction = this.db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');

    return new Promise((resolve) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Error getting pending actions');
        resolve([]);
      };
    });
  }

  /**
   * Remove pending action after successful sync
   */
  async removePendingAction(id: number): Promise<void> {
    await this.ensureInit();
    if (!this.db) return;

    const transaction = this.db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');

    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    await this.ensureInit();
    if (!this.db) return;

    const transaction = this.db.transaction(['posts'], 'readwrite');
    const store = transaction.objectStore('posts');
    const index = store.index('expiresAt');

    const now = Date.now();
    const range = IDBKeyRange.upperBound(now);

    return new Promise((resolve) => {
      const request = index.openCursor(range);
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          store.delete(cursor.primaryKey);
          deletedCount++;
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`🗑️ Cleared ${deletedCount} expired cache entries`);
          }
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    posts: number;
    images: number;
    pendingActions: number;
  }> {
    await this.ensureInit();
    if (!this.db) return { posts: 0, images: 0, pendingActions: 0 };

    const stats = { posts: 0, images: 0, pendingActions: 0 };

    // Count posts
    const postsTransaction = this.db.transaction(['posts'], 'readonly');
    stats.posts = await new Promise<number>((resolve) => {
      const request = postsTransaction.objectStore('posts').count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });

    // Count images
    const imagesTransaction = this.db.transaction(['images'], 'readonly');
    stats.images = await new Promise<number>((resolve) => {
      const request = imagesTransaction.objectStore('images').count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });

    // Count pending actions
    const actionsTransaction = this.db.transaction(['pendingActions'], 'readonly');
    stats.pendingActions = await new Promise<number>((resolve) => {
      const request = actionsTransaction.objectStore('pendingActions').count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });

    return stats;
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    await this.ensureInit();
    if (!this.db) return;

    const storeNames = ['posts', 'images', 'profiles', 'pendingActions'];

    for (const storeName of storeNames) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }

    console.log('🗑️ All cache cleared');
  }
}

// Export singleton instance
export const indexedDBManager = new IndexedDBManager();
export default IndexedDBManager;
