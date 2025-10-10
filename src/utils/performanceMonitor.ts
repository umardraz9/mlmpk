// Performance monitoring utility for tracking page loads and API calls

interface PerformanceMetrics {
  pageLoadTime: number;
  apiCallTime: number;
  renderTime: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private apiCallStart: Map<string, number> = new Map();

  // Track page load performance
  measurePageLoad(pageName: string): void {
    if (typeof window === 'undefined') return;

    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigationTiming) {
      const pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
      const renderTime = navigationTiming.domComplete - navigationTiming.domContentLoadedEventStart;
      
      this.addMetric(pageName, {
        pageLoadTime,
        renderTime,
        apiCallTime: 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      });
    }
  }

  // Start tracking an API call
  startApiCall(endpoint: string): void {
    this.apiCallStart.set(endpoint, performance.now());
  }

  // End tracking an API call
  endApiCall(endpoint: string): void {
    const startTime = this.apiCallStart.get(endpoint);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.apiCallStart.delete(endpoint);
      
      this.addMetric(endpoint, {
        pageLoadTime: 0,
        renderTime: 0,
        apiCallTime: duration,
        memoryUsage: (performance as any).memory?.usedJSHeapSize
      });
    }
  }

  // Add a metric
  private addMetric(key: string, metric: PerformanceMetrics): void {
    const existing = this.metrics.get(key) || [];
    existing.push(metric);
    
    // Keep only last 100 entries per key
    if (existing.length > 100) {
      existing.shift();
    }
    
    this.metrics.set(key, existing);
  }

  // Get average metrics for a key
  getAverageMetrics(key: string): PerformanceMetrics | null {
    const metrics = this.metrics.get(key);
    if (!metrics || metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => ({
      pageLoadTime: acc.pageLoadTime + m.pageLoadTime,
      renderTime: acc.renderTime + m.renderTime,
      apiCallTime: acc.apiCallTime + m.apiCallTime,
      memoryUsage: (acc.memoryUsage || 0) + (m.memoryUsage || 0)
    }), { pageLoadTime: 0, renderTime: 0, apiCallTime: 0, memoryUsage: 0 });

    return {
      pageLoadTime: sum.pageLoadTime / metrics.length,
      renderTime: sum.renderTime / metrics.length,
      apiCallTime: sum.apiCallTime / metrics.length,
      memoryUsage: sum.memoryUsage / metrics.length
    };
  }

  // Get all metrics
  getAllMetrics(): Map<string, PerformanceMetrics[]> {
    return this.metrics;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
    this.apiCallStart.clear();
  }

  // Log performance warning if threshold exceeded
  checkPerformanceThreshold(key: string, thresholds: Partial<PerformanceMetrics>): boolean {
    const avg = this.getAverageMetrics(key);
    if (!avg) return false;

    let hasIssue = false;
    
    if (thresholds.pageLoadTime && avg.pageLoadTime > thresholds.pageLoadTime) {
      console.warn(`⚠️ Page load time for ${key} exceeds threshold: ${avg.pageLoadTime.toFixed(2)}ms > ${thresholds.pageLoadTime}ms`);
      hasIssue = true;
    }
    
    if (thresholds.apiCallTime && avg.apiCallTime > thresholds.apiCallTime) {
      console.warn(`⚠️ API call time for ${key} exceeds threshold: ${avg.apiCallTime.toFixed(2)}ms > ${thresholds.apiCallTime}ms`);
      hasIssue = true;
    }
    
    if (thresholds.renderTime && avg.renderTime > thresholds.renderTime) {
      console.warn(`⚠️ Render time for ${key} exceeds threshold: ${avg.renderTime.toFixed(2)}ms > ${thresholds.renderTime}ms`);
      hasIssue = true;
    }

    return hasIssue;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor(pageName: string) {
  if (typeof window !== 'undefined') {
    // Measure page load on mount
    performanceMonitor.measurePageLoad(pageName);
    
    // Check thresholds
    performanceMonitor.checkPerformanceThreshold(pageName, {
      pageLoadTime: 3000, // 3 seconds
      renderTime: 1000,   // 1 second
      apiCallTime: 500    // 500ms
    });
  }
}

// Utility to wrap fetch with performance monitoring
export async function monitoredFetch(url: string, options?: RequestInit): Promise<Response> {
  performanceMonitor.startApiCall(url);
  try {
    const response = await fetch(url, options);
    return response;
  } finally {
    performanceMonitor.endApiCall(url);
  }
}
