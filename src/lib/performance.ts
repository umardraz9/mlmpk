// Performance monitoring and optimization utilities
import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;

  // Record a performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      ...metadata
    };

    this.metrics.push(metric);

    // Keep only the latest metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Performance logging disabled
  }

  // Get metrics by name
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  // Get average for a metric
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  // Get performance summary
  getSummary(): Record<string, { count: number; average: number; min: number; max: number }> {
    const summary: Record<string, { count: number; average: number; min: number; max: number }> = {};

    const metricNames = [...new Set(this.metrics.map(m => m.name))];

    metricNames.forEach(name => {
      const metrics = this.getMetrics(name);
      const values = metrics.map(m => m.value);
      
      summary[name] = {
        count: metrics.length,
        average: values.reduce((sum, v) => sum + v, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });

    return summary;
  }

  // Clear old metrics
  clearOldMetrics(olderThanHours: number = 24) {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance measurement decorator
export function measurePerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;
        performanceMonitor.recordMetric(name, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        performanceMonitor.recordMetric(`${name}_error`, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

// Async function performance wrapper
export async function measureAsync<T>(
  name: string, 
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(name, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(`${name}_error`, duration, metadata);
    throw error;
  }
}

// Web Vitals monitoring disabled
export function initWebVitalsMonitoring() {
  // Disabled to prevent console spam
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof window === 'undefined') return null;
  
  const memory = (performance as any).memory;
  if (memory) {
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  
  return null;
}

// Bundle size analyzer disabled
export function analyzeBundleSize() {
  // Disabled to prevent console spam
}

// Performance report generator
export function generatePerformanceReport() {
  const summary = performanceMonitor.getSummary();
  const memory = getMemoryUsage();
  
  const report = {
    timestamp: new Date().toISOString(),
    metrics: summary,
    memory,
    recommendations: []
  };

  // Generate recommendations based on metrics
  const recommendations: string[] = [];

  if (summary.LCP && summary.LCP.average > 2500) {
    recommendations.push('LCP is slow. Consider optimizing images and reducing server response time.');
  }

  if (summary.FID && summary.FID.average > 100) {
    recommendations.push('FID is high. Consider reducing JavaScript execution time.');
  }

  if (summary.CLS && summary.CLS.average > 0.1) {
    recommendations.push('CLS is high. Ensure images and ads have dimensions set.');
  }

  if (memory && memory.usagePercentage > 80) {
    recommendations.push('Memory usage is high. Consider implementing lazy loading and code splitting.');
  }

  report.recommendations = recommendations;

  return report;
}
