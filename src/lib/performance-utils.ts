/**
 * Performance monitoring and optimization utilities
 */

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Preload critical images
  const criticalImages = [
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
  ];

  criticalImages.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}

/**
 * Defer non-critical resources
 */
export function deferNonCriticalResources() {
  if (typeof window === 'undefined') return;

  // Defer third-party scripts
  window.addEventListener('load', () => {
    // Load analytics or other third-party scripts here
    console.log('Non-critical resources loaded');
  });
}

/**
 * Measure page load time
 */
export function measurePageLoadTime(): number | null {
  if (typeof window === 'undefined' || !window.performance) return null;

  const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!perfData) return null;

  return perfData.loadEventEnd - perfData.fetchStart;
}

/**
 * Measure First Contentful Paint (FCP)
 */
export function measureFCP(): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      resolve(null);
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            observer.disconnect();
            resolve(entry.startTime);
            return;
          }
        }
      });

      observer.observe({ type: 'paint', buffered: true });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 10000);
    } catch (error) {
      console.error('Error measuring FCP:', error);
      resolve(null);
    }
  });
}

/**
 * Measure Largest Contentful Paint (LCP)
 */
export function measureLCP(): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      resolve(null);
      return;
    }

    try {
      let lcp: number | null = null;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        lcp = lastEntry.renderTime || lastEntry.loadTime;
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });

      // Report LCP when page is hidden
      const reportLCP = () => {
        observer.disconnect();
        resolve(lcp);
      };

      document.addEventListener('visibilitychange', reportLCP, { once: true });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(lcp);
      }, 10000);
    } catch (error) {
      console.error('Error measuring LCP:', error);
      resolve(null);
    }
  });
}

/**
 * Measure Time to Interactive (TTI)
 */
export function measureTTI(): number | null {
  if (typeof window === 'undefined' || !window.performance) return null;

  const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!perfData) return null;

  return perfData.domInteractive - perfData.fetchStart;
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
export function measureCLS(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      resolve(0);
      return;
    }

    try {
      let cls = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      // Report CLS when page is hidden
      const reportCLS = () => {
        observer.disconnect();
        resolve(cls);
      };

      document.addEventListener('visibilitychange', reportCLS, { once: true });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(cls);
      }, 10000);
    } catch (error) {
      console.error('Error measuring CLS:', error);
      resolve(0);
    }
  });
}

/**
 * Get all Core Web Vitals
 */
export async function getCoreWebVitals() {
  const [fcp, lcp, cls] = await Promise.all([
    measureFCP(),
    measureLCP(),
    measureCLS(),
  ]);

  return {
    fcp,
    lcp,
    tti: measureTTI(),
    cls,
    pageLoadTime: measurePageLoadTime(),
  };
}

/**
 * Report web vitals to analytics
 */
export function reportWebVitals(metrics: {
  fcp: number | null;
  lcp: number | null;
  tti: number | null;
  cls: number;
  pageLoadTime: number | null;
}) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metrics);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to your analytics service
    // Example: analytics.track('web_vitals', metrics);
  }
}

/**
 * Optimize images on the fly
 */
export function optimizeImageUrl(
  url: string,
  width?: number,
  quality: number = 75
): string {
  if (!url || url.startsWith('data:')) return url;

  // For Next.js Image Optimization API
  if (url.startsWith('/') || url.includes(process.env.NEXT_PUBLIC_APP_URL || '')) {
    const params = new URLSearchParams();
    params.set('url', url);
    if (width) params.set('w', width.toString());
    params.set('q', quality.toString());
    return `/_next/image?${params.toString()}`;
  }

  return url;
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check network connection quality
 */
export function getNetworkQuality(): 'slow' | 'fast' | 'unknown' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }

  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType;

  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  }

  return 'fast';
}

/**
 * Prefetch route for faster navigation
 */
export function prefetchRoute(href: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Preconnect to domain for faster resource loading
 */
export function preconnectDomain(domain: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = domain;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}
