'use client'

import { Suspense, useEffect, useCallback, useMemo, useState, memo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'

// Optimized loading skeleton component - moved before dynamic imports
const HomePageSkeleton = memo(function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero skeleton */}
      <div className="h-96 bg-gradient-to-r from-green-600 to-blue-600 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-80 mx-auto bg-white/20" />
          <Skeleton className="h-6 w-96 mx-auto bg-white/20" />
          <div className="flex gap-4 justify-center">
            <Skeleton className="h-12 w-32 bg-white/20" />
            <Skeleton className="h-12 w-32 bg-white/20" />
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6">
              <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-20 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Dynamic import for the desktop homepage component
const DynamicDesktopHomePage = dynamic(() => 
  import('@/components/pages/DesktopHomePage').then(mod => ({ default: mod.default })), 
  {
    loading: HomePageSkeleton,
    ssr: true
  }
);

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string;
  category?: string;
  rating?: number;
  reviewCount: number;
  sales: number;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  publishedAt: string;
  views: number;
  likes: number;
  author: {
    name: string;
  };
  category: {
    name: string;
  };
}


// Enhanced data fetching hook with caching and error handling
const useHomePageData = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced fetch function with retry logic and caching
  const fetchFeaturedContent = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check sessionStorage cache first (unless force refresh)
      const cacheKey = 'homepage-data';
      const cachedData = !forceRefresh ? sessionStorage.getItem(cacheKey) : null;
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setFeaturedProducts(data.products || []);
            setFeaturedArticles(data.articles || []);
            setLoading(false);
            return;
          }
        } catch {
          // Invalid cache data, continue with fetch
          sessionStorage.removeItem(cacheKey);
        }
      }

      // Fetch with timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await fetch(url, {
              headers: { 
                'Cache-Control': 'max-age=300',
                'Accept': 'application/json'
              },
              signal: controller.signal
            });
            
            if (response.ok) return response;
            if (response.status === 404) throw new Error('Not found');
            if (i === retries - 1) throw new Error(`HTTP ${response.status}`);
          } catch (error) {
            if (i === retries - 1) throw error;
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
        throw new Error('Max retries exceeded');
      };

      // Parallel fetch with error handling
      const [productsRes, articlesRes] = await Promise.allSettled([
        fetchWithRetry('/api/products/featured'),
        fetchWithRetry('/api/blog/featured')
      ]);
      
      clearTimeout(timeoutId);

      const products = productsRes.status === 'fulfilled' 
        ? await productsRes.value.json() 
        : [];
      const articles = articlesRes.status === 'fulfilled' 
        ? await articlesRes.value.json() 
        : [];

      // Cache the results
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: { products, articles },
          timestamp: Date.now()
        }));
      } catch {
        // Storage quota exceeded, ignore
      }

      setFeaturedProducts(products);
      setFeaturedArticles(articles);
    } catch (error) {
      console.error('Error fetching featured content:', error);
      setError(error instanceof Error ? error.message : 'Failed to load content');
      
      // Try to use stale cache data on error
      try {
        const staleData = sessionStorage.getItem('homepage-data');
        if (staleData) {
          const { data } = JSON.parse(staleData);
          setFeaturedProducts(data.products || []);
          setFeaturedArticles(data.articles || []);
        }
      } catch {
        // Ignore cache errors
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    featuredProducts,
    featuredArticles,
    loading,
    error,
    fetchFeaturedContent
  };
};

// Optimized price formatter with memoization
const usePriceFormatter = () => {
  return useMemo(() => {
    const formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return (price: number) => formatter.format(price);
  }, []);
};

// Optimized date formatter with memoization
const useDateFormatter = () => {
  return useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Karachi'
    });
    return (dateString: string) => {
      try {
        return formatter.format(new Date(dateString));
      } catch {
        return 'Invalid date';
      }
    };
  }, []);
};

// Main optimized HomePage component
export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { featuredProducts, featuredArticles, loading, error, fetchFeaturedContent } = useHomePageData();
  const formatPrice = usePriceFormatter();
  const formatDate = useDateFormatter();
  
  // Monitor performance metrics
  usePerformanceMonitor('Homepage');
  

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Add a small delay to prevent jarring redirect
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [status, session, router]);

  // Initialize data on mount (only if not authenticated)
  useEffect(() => {
    if (status !== 'authenticated') {
      fetchFeaturedContent();
    }
  }, [fetchFeaturedContent, status]);

  // Show loading state while checking authentication or redirecting
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirect message for authenticated users
  if (status === 'authenticated' && session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Error boundary fallback
  if (error && !featuredProducts.length && !featuredArticles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="text-red-500 text-lg mb-4">Failed to load content</div>
          <p className="text-gray-600 mb-6">Please check your internet connection and try again.</p>
          <button 
            onClick={() => fetchFeaturedContent(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <DynamicDesktopHomePage 
        featuredProducts={featuredProducts}
        featuredArticles={featuredArticles}
        loading={loading}
        formatPrice={formatPrice}
        formatDate={formatDate}
      />
    </Suspense>
  );
}
