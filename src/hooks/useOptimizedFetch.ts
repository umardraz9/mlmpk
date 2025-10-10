import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseOptimizedFetchOptions {
  cacheTime?: number; // in milliseconds
  refetchInterval?: number; // in milliseconds
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

const cache = new Map<string, CacheEntry<any>>();

export function useOptimizedFetch<T = any>(
  url: string | null,
  options: UseOptimizedFetchOptions = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutes default
    refetchInterval,
    enabled = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    // Check cache first
    const cacheKey = url;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data);
      setError(null);
      if (onSuccess) onSuccess(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Update cache
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      setData(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [url, enabled, cacheTime, onSuccess, onError]);

  useEffect(() => {
    fetchData();

    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refetchInterval, enabled]);

  const refetch = useCallback(() => {
    // Clear cache for this URL
    if (url) {
      cache.delete(url);
    }
    return fetchData();
  }, [url, fetchData]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
    if (url) {
      cache.set(url, {
        data: newData,
        timestamp: Date.now()
      });
    }
  }, [url]);

  return {
    data,
    loading,
    error,
    refetch,
    mutate
  };
}

// Clear cache utility
export function clearFetchCache() {
  cache.clear();
}

// Clear specific URL from cache
export function clearCacheForUrl(url: string) {
  cache.delete(url);
}
