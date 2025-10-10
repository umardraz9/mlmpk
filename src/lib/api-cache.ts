import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// Cache configuration
const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutes
const DEFAULT_MAX_SIZE = 100; // Maximum number of items

// Create different cache instances for different data types
const caches = new Map<string, LRUCache<string, any>>();

// Get or create a cache instance
function getCache(namespace: string, options?: {
  ttl?: number;
  max?: number;
}) {
  if (!caches.has(namespace)) {
    caches.set(namespace, new LRUCache({
      max: options?.max || DEFAULT_MAX_SIZE,
      ttl: options?.ttl || DEFAULT_TTL,
      allowStale: true,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
    }));
  }
  return caches.get(namespace)!;
}

// Generate cache key from parameters
function generateCacheKey(params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);

  return crypto
    .createHash('md5')
    .update(JSON.stringify(sortedParams))
    .digest('hex');
}

// Cache decorator for async functions
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    namespace?: string;
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
    shouldCache?: (...args: Parameters<T>) => boolean;
  }
): T {
  const namespace = options?.namespace || fn.name || 'default';
  const cache = getCache(namespace, { ttl: options?.ttl });

  return (async (...args: Parameters<T>) => {
    // Check if we should cache this call
    if (options?.shouldCache && !options.shouldCache(...args)) {
      return fn(...args);
    }

    // Generate cache key
    const cacheKey = options?.keyGenerator
      ? options.keyGenerator(...args)
      : generateCacheKey({ args });

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      console.log(`Cache hit for ${namespace}:${cacheKey}`);
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn(...args);
      cache.set(cacheKey, result);
      console.log(`Cache set for ${namespace}:${cacheKey}`);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }) as T;
}

// Manual cache management
export const cache = {
  get: (namespace: string, key: string) => {
    const c = caches.get(namespace);
    return c?.get(key);
  },

  set: (namespace: string, key: string, value: any, ttl?: number) => {
    const c = getCache(namespace, { ttl });
    c.set(key, value);
  },

  delete: (namespace: string, key: string) => {
    const c = caches.get(namespace);
    c?.delete(key);
  },

  clear: (namespace?: string) => {
    if (namespace) {
      caches.get(namespace)?.clear();
    } else {
      caches.forEach(c => c.clear());
    }
  },

  has: (namespace: string, key: string) => {
    const c = caches.get(namespace);
    return c?.has(key) || false;
  },
};

// Stale-while-revalidate pattern
export function withSWR<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    namespace?: string;
    ttl?: number;
    staleTTL?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  }
): T {
  const namespace = options?.namespace || fn.name || 'default';
  const cache = getCache(namespace, { ttl: options?.staleTTL || options?.ttl });

  return (async (...args: Parameters<T>) => {
    const cacheKey = options?.keyGenerator
      ? options.keyGenerator(...args)
      : generateCacheKey({ args });

    // Get cached value (even if stale)
    const cached = cache.get(cacheKey);
    
    // If we have a cached value, return it immediately
    if (cached !== undefined) {
      // Revalidate in the background if stale
      const isStale = !cache.has(cacheKey);
      if (isStale) {
        fn(...args).then(result => {
          cache.set(cacheKey, result);
        }).catch(console.error);
      }
      return cached;
    }

    // No cached value, fetch and cache
    const result = await fn(...args);
    cache.set(cacheKey, result);
    return result;
  }) as T;
}

// Batch requests to prevent thundering herd
const pendingRequests = new Map<string, Promise<any>>();

export function withBatching<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    keyGenerator?: (...args: Parameters<T>) => string;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const key = options?.keyGenerator
      ? options.keyGenerator(...args)
      : generateCacheKey({ args });

    // If there's already a pending request, return it
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }

    // Create new request and store promise
    const promise = fn(...args).finally(() => {
      pendingRequests.delete(key);
    });

    pendingRequests.set(key, promise);
    return promise;
  }) as T;
}

// Response compression utility
export async function compressResponse(data: any): Promise<Buffer> {
  const { gzip } = await import('zlib');
  const { promisify } = await import('util');
  const compress = promisify(gzip);
  
  const json = JSON.stringify(data);
  return compress(Buffer.from(json));
}

export async function decompressResponse(data: Buffer): Promise<any> {
  const { gunzip } = await import('zlib');
  const { promisify } = await import('util');
  const decompress = promisify(gunzip);
  
  const decompressed = await decompress(data);
  return JSON.parse(decompressed.toString());
}

// ETags for conditional requests
export function generateETag(data: any): string {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
}

export function checkETag(etag: string | null, data: any): boolean {
  if (!etag) return false;
  return etag === generateETag(data);
}
