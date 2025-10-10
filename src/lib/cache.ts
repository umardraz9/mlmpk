/**
 * Lightweight Caching Layer for Partnership Program
 * Uses LRU Cache for in-memory caching with TTL support
 */

import { LRUCache } from 'lru-cache';
import { logger } from './logger';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  max?: number; // Maximum number of items
}

class CacheManager {
  private cache: LRUCache<string, any>;
  private hitCount = 0;
  private missCount = 0;

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache({
      max: options.max || 500,
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      allowStale: false,
      updateAgeOnGet: true,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = this.cache.get(key);
      if (value !== undefined) {
        this.hitCount++;
        logger.debug(`Cache HIT for key: ${key}`, undefined, 'CACHE');
        return value as T;
      }
      
      this.missCount++;
      logger.debug(`Cache MISS for key: ${key}`, undefined, 'CACHE');
      return null;
    } catch (error) {
      logger.error('Cache get error', error, 'CACHE');
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        this.cache.set(key, value, { ttl });
      } else {
        this.cache.set(key, value);
      }
      logger.debug(`Cache SET for key: ${key}`, undefined, 'CACHE');
    } catch (error) {
      logger.error('Cache set error', error, 'CACHE');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      logger.debug(`Cache DELETE for key: ${key}`, undefined, 'CACHE');
    } catch (error) {
      logger.error('Cache delete error', error, 'CACHE');
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = Array.from(this.cache.keys()).filter(key => 
        key.includes(pattern) || key.match(new RegExp(pattern))
      );
      
      keys.forEach(key => this.cache.delete(key));
      logger.info(`Cache invalidated ${keys.length} keys matching pattern: ${pattern}`, undefined, 'CACHE');
    } catch (error) {
      logger.error('Cache invalidate pattern error', error, 'CACHE');
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.hitCount = 0;
      this.missCount = 0;
      logger.info('Cache cleared', undefined, 'CACHE');
    } catch (error) {
      logger.error('Cache clear error', error, 'CACHE');
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      maxSize: this.cache.max,
    };
  }

  // Helper method for cache-aside pattern
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFunction();
    await this.set(key, value, ttl);
    return value;
  }
}

// Create different cache instances for different use cases
export const apiCache = new CacheManager({
  max: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes for API responses
});

export const userCache = new CacheManager({
  max: 500,
  ttl: 10 * 60 * 1000, // 10 minutes for user data
});

export const notificationCache = new CacheManager({
  max: 200,
  ttl: 2 * 60 * 1000, // 2 minutes for notifications
});

export const mlmCache = new CacheManager({
  max: 300,
  ttl: 15 * 60 * 1000, // 15 minutes for MLM calculations
});

export const blogCache = new CacheManager({
  max: 100,
  ttl: 30 * 60 * 1000, // 30 minutes for blog posts
});

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userNotifications: (id: string) => `notifications:${id}`,
  blogPost: (slug: string) => `blog:${slug}`,
  blogPosts: (page: number, category?: string) => `blog:list:${page}:${category || 'all'}`,
  mlmCommissions: (userId: string) => `mlm:commissions:${userId}`,
  mlmNetwork: (userId: string, level: number) => `mlm:network:${userId}:${level}`,
  products: (page: number, category?: string) => `products:${page}:${category || 'all'}`,
  orders: (userId: string) => `orders:${userId}`,
};

// Cache invalidation helpers
export const invalidateUserCache = async (userId: string) => {
  await userCache.delete(cacheKeys.user(userId));
  await notificationCache.delete(cacheKeys.userNotifications(userId));
  await mlmCache.invalidatePattern(`mlm:.*:${userId}`);
};

export const invalidateBlogCache = async () => {
  await blogCache.invalidatePattern('blog:');
};

export const invalidateProductCache = async () => {
  await apiCache.invalidatePattern('products:');
};

// Middleware for automatic cache headers
export const getCacheHeaders = (ttlSeconds: number = 300) => ({
  'Cache-Control': `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`,
  'ETag': `"${Date.now()}"`,
});

// Cache warming functions
export const warmCache = async () => {
  try {
    logger.info('Starting cache warming', undefined, 'CACHE');
    
    // Warm up frequently accessed data
    // This would be called on app startup
    
    logger.info('Cache warming completed', undefined, 'CACHE');
  } catch (error) {
    logger.error('Cache warming failed', error, 'CACHE');
  }
};

// Export default cache for general use
export default apiCache;
