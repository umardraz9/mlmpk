import { NextRequest, NextResponse } from 'next/server';

interface CacheEntry {
  data: any;
  timestamp: number;
  etag: string;
}

// In-memory cache for API responses
const cache = new Map<string, CacheEntry>();

// Cache configuration
const CACHE_CONFIG = {
  // API routes and their cache duration in seconds
  '/api/products': 300, // 5 minutes
  '/api/products/featured': 600, // 10 minutes
  '/api/blog/featured': 600, // 10 minutes
  '/api/categories': 1800, // 30 minutes
  '/api/testimonials': 3600, // 1 hour
};

// Generate ETag from data
function generateETag(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${hash.toString(36)}"`;
}

// Check if cached data is still fresh
function isCacheFresh(entry: CacheEntry, maxAge: number): boolean {
  return Date.now() - entry.timestamp < maxAge * 1000;
}

// Get cache key from request
function getCacheKey(request: NextRequest): string {
  const url = new URL(request.url);
  return `${url.pathname}${url.search}`;
}

// Cache middleware for API routes
export function withCache(
  handler: (request: NextRequest) => Promise<NextResponse>,
  customMaxAge?: number
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Only cache GET requests
    if (request.method !== 'GET') {
      return handler(request);
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const cacheKey = getCacheKey(request);
    
    // Get cache duration for this route
    const maxAge = customMaxAge || CACHE_CONFIG[pathname] || 0;
    
    // If no caching configured, proceed without cache
    if (maxAge === 0) {
      return handler(request);
    }

    // Check for cached response
    const cached = cache.get(cacheKey);
    
    // Handle If-None-Match header (ETag validation)
    const clientETag = request.headers.get('If-None-Match');
    
    if (cached && isCacheFresh(cached, maxAge)) {
      // If client has the same ETag, return 304 Not Modified
      if (clientETag === cached.etag) {
        return new NextResponse(null, { 
          status: 304,
          headers: {
            'ETag': cached.etag,
            'Cache-Control': `public, max-age=${maxAge}`,
          }
        });
      }
      
      // Return cached response with cache headers
      return NextResponse.json(cached.data, {
        headers: {
          'ETag': cached.etag,
          'Cache-Control': `public, max-age=${maxAge}`,
          'X-Cache': 'HIT',
          'X-Cache-Age': String(Math.floor((Date.now() - cached.timestamp) / 1000))
        }
      });
    }

    // Fetch fresh data
    const response = await handler(request);
    
    // Only cache successful responses
    if (response.status === 200) {
      try {
        const data = await response.json();
        const etag = generateETag(data);
        
        // Store in cache
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          etag
        });
        
        // Limit cache size (LRU-like behavior)
        if (cache.size > 100) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        
        // Return response with cache headers
        return NextResponse.json(data, {
          headers: {
            'ETag': etag,
            'Cache-Control': `public, max-age=${maxAge}`,
            'X-Cache': 'MISS'
          }
        });
      } catch (error) {
        // If response is not JSON, return as is
        return response;
      }
    }
    
    return response;
  };
}

// Clear cache utility
export function clearApiCache(pattern?: string): void {
  if (pattern) {
    // Clear matching keys
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all
    cache.clear();
  }
}

// Get cache statistics
export function getCacheStats(): {
  size: number;
  keys: string[];
  memory: number;
} {
  const keys = Array.from(cache.keys());
  let memory = 0;
  
  cache.forEach((entry) => {
    memory += JSON.stringify(entry).length;
  });
  
  return {
    size: cache.size,
    keys,
    memory
  };
}
