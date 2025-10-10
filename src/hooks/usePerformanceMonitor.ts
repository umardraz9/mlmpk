'use client';

import React, { useEffect, useState } from 'react';
import { getCoreWebVitals } from '@/lib/performance-utils';

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  tti: number | null;
  cls: number;
  pageLoadTime: number | null;
  isLoading: boolean;
}

/**
 * Hook to monitor page performance metrics
 * Automatically tracks Core Web Vitals and reports them
 */
export function usePerformanceMonitor(pageName?: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    tti: null,
    cls: 0,
    pageLoadTime: null,
    isLoading: true,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let mounted = true;

    const measurePerformance = async () => {
      try {
        const vitals = await getCoreWebVitals();
        
        if (!mounted) return;

        setMetrics({
          ...vitals,
          isLoading: false,
        });

        // Log metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.group(`📊 Performance Metrics${pageName ? ` - ${pageName}` : ''}`);
          console.table({
            'First Contentful Paint': vitals.fcp ? `${Math.round(vitals.fcp)}ms` : 'N/A',
            'Largest Contentful Paint': vitals.lcp ? `${Math.round(vitals.lcp)}ms` : 'N/A',
            'Time to Interactive': vitals.tti ? `${Math.round(vitals.tti)}ms` : 'N/A',
            'Cumulative Layout Shift': vitals.cls.toFixed(3),
            'Page Load Time': vitals.pageLoadTime ? `${Math.round(vitals.pageLoadTime)}ms` : 'N/A',
          });
          console.groupEnd();
        }

        // Send to analytics in production
        if (process.env.NODE_ENV === 'production') {
          // TODO: Send to your analytics service
          // Example: analytics.track('performance_metrics', { ...vitals, page: pageName });
        }
      } catch (error) {
        console.error('Error measuring performance:', error);
        if (mounted) {
          setMetrics(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    // Start measuring after a short delay to ensure page is loaded
    const timer = setTimeout(measurePerformance, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [pageName]);

  return metrics;
}

/**
 * Component wrapper that logs performance metrics
 * Use this to wrap pages you want to monitor
 */
export function withPerformanceMonitoring(
  Component: React.ComponentType<any>,
  pageName: string
) {
  return function PerformanceMonitoredComponent(props: any) {
    usePerformanceMonitor(pageName);
    return React.createElement(Component, props);
  };
}

/**
 * Hook to track custom performance marks
 */
export function usePerformanceMark() {
  const mark = (name: string) => {
    if (typeof window === 'undefined' || !window.performance) return;
    
    try {
      window.performance.mark(name);
    } catch (error) {
      console.error('Error creating performance mark:', error);
    }
  };

  const measure = (name: string, startMark: string, endMark?: string) => {
    if (typeof window === 'undefined' || !window.performance) return null;
    
    try {
      if (endMark) {
        window.performance.measure(name, startMark, endMark);
      } else {
        window.performance.measure(name, startMark);
      }
      
      const measures = window.performance.getEntriesByName(name, 'measure');
      return measures.length > 0 ? measures[measures.length - 1].duration : null;
    } catch (error) {
      console.error('Error measuring performance:', error);
      return null;
    }
  };

  const clearMarks = (name?: string) => {
    if (typeof window === 'undefined' || !window.performance) return;
    
    try {
      if (name) {
        window.performance.clearMarks(name);
        window.performance.clearMeasures(name);
      } else {
        window.performance.clearMarks();
        window.performance.clearMeasures();
      }
    } catch (error) {
      console.error('Error clearing performance marks:', error);
    }
  };

  return { mark, measure, clearMarks };
}
