import React from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP, CLSMetric, FCPMetric, LCPMetric, TTFBMetric, INPMetric } from 'web-vitals';

type MetricName = 'CLS' | 'FCP' | 'LCP' | 'TTFB' | 'INP';

interface PerformanceMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id: string;
}

// Thresholds for Web Vitals (in milliseconds)
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

// Performance monitoring class
class PerformanceMonitor {
  private metrics: Map<MetricName, PerformanceMetric> = new Map();
  private callbacks: Set<(metrics: Map<MetricName, PerformanceMetric>) => void> = new Set();
  private analyticsEndpoint?: string;

  constructor(analyticsEndpoint?: string) {
    this.analyticsEndpoint = analyticsEndpoint;
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    onCLS(this.handleMetric('CLS'));
    onFCP(this.handleMetric('FCP'));
    onLCP(this.handleMetric('LCP'));
    onTTFB(this.handleMetric('TTFB'));
    onINP(this.handleMetric('INP'));

    // Monitor custom metrics
    this.monitorResourceTiming();
    this.monitorMemoryUsage();
    this.monitorNetworkSpeed();
  }

  private handleMetric = (name: MetricName) => {
    return (metric: CLSMetric | FCPMetric | LCPMetric | TTFBMetric | INPMetric) => {
      const rating = this.getRating(name, metric.value);
      
      const performanceMetric: PerformanceMetric = {
        name,
        value: metric.value,
        rating,
        timestamp: Date.now(),
        id: metric.id,
      };

      this.metrics.set(name, performanceMetric);
      this.notifyCallbacks();
      this.sendToAnalytics(performanceMetric);

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] ${name}:`, {
          value: metric.value,
          rating,
          ...metric.entries?.length && { entries: metric.entries },
        });
      }
    };
  };

  private getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[name];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private monitorResourceTiming() {
    if (!('performance' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resourceEntry.duration > 1000) {
            console.warn('[Performance] Slow resource:', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              type: resourceEntry.initiatorType,
              size: resourceEntry.transferSize,
            });
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Resource timing not supported');
    }
  }

  private monitorMemoryUsage() {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize / 1048576; // Convert to MB
      const totalMemory = memory.totalJSHeapSize / 1048576;

      if (usedMemory > totalMemory * 0.9) {
        console.warn('[Performance] High memory usage:', {
          used: `${usedMemory.toFixed(2)} MB`,
          total: `${totalMemory.toFixed(2)} MB`,
          percentage: `${((usedMemory / totalMemory) * 100).toFixed(2)}%`,
        });
      }
    }, 30000); // Check every 30 seconds
  }

  private monitorNetworkSpeed() {
    if (!('connection' in navigator)) return;

    const connection = (navigator as any).connection;
    
    const logNetworkInfo = () => {
      console.log('[Performance] Network info:', {
        effectiveType: connection.effectiveType,
        downlink: `${connection.downlink} Mbps`,
        rtt: `${connection.rtt} ms`,
        saveData: connection.saveData,
      });
    };

    connection.addEventListener('change', logNetworkInfo);
    logNetworkInfo(); // Log initial state
  }

  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.metrics));
  }

  private async sendToAnalytics(metric: PerformanceMetric) {
    if (!this.analyticsEndpoint) return;

    try {
      await fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...metric,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('[Analytics] Failed to send metric:', error);
    }
  }

  // Public methods
  public subscribe(callback: (metrics: Map<MetricName, PerformanceMetric>) => void) {
    this.callbacks.add(callback);
    // Immediately call with current metrics
    if (this.metrics.size > 0) {
      callback(this.metrics);
    }
  }

  public unsubscribe(callback: (metrics: Map<MetricName, PerformanceMetric>) => void) {
    this.callbacks.delete(callback);
  }

  public getMetrics(): Map<MetricName, PerformanceMetric> {
    return new Map(this.metrics);
  }

  public clearMetrics() {
    this.metrics.clear();
  }

  // Custom timing methods
  public startTimer(name: string) {
    if ('performance' in window) {
      performance.mark(`${name}-start`);
    }
  }

  public endTimer(name: string) {
    if ('performance' in window) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name)[0];
        
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
        
        // Clean up marks
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
        
        return measure.duration;
      } catch (error) {
        console.error(`[Performance] Failed to measure ${name}:`, error);
      }
    }
    return 0;
  }
}

// Create singleton instance
let monitorInstance: PerformanceMonitor | null = null;

export const initializePerformanceMonitoring = (analyticsEndpoint?: string) => {
  if (!monitorInstance && typeof window !== 'undefined') {
    monitorInstance = new PerformanceMonitor(analyticsEndpoint);
  }
  return monitorInstance;
};

export const getPerformanceMonitor = () => monitorInstance;

// React hook for performance monitoring
export const useWebVitals = (callback?: (metrics: Map<MetricName, PerformanceMetric>) => void) => {
  const [metrics, setMetrics] = React.useState<Map<MetricName, PerformanceMetric>>(new Map());

  React.useEffect(() => {
    const monitor = initializePerformanceMonitoring();
    if (!monitor) return;

    const handleMetrics = (newMetrics: Map<MetricName, PerformanceMetric>) => {
      setMetrics(new Map(newMetrics));
      callback?.(newMetrics);
    };

    monitor.subscribe(handleMetrics);

    return () => {
      monitor.unsubscribe(handleMetrics);
    };
  }, [callback]);

  return metrics;
};

// Utility to report custom metrics
export const reportCustomMetric = (name: string, value: number, unit = 'ms') => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Custom Metric] ${name}: ${value}${unit}`);
  }
  
  // Send to analytics if configured
  const monitor = getPerformanceMonitor();
  if (monitor) {
    (monitor as any).sendToAnalytics({
      name,
      value,
      unit,
      timestamp: Date.now(),
    });
  }
};

// Export types
export type { PerformanceMetric, MetricName };
