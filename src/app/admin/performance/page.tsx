'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { Activity, TrendingUp, Clock, Layers, Timer, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import { useWebVitals } from '@/lib/web-vitals';

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  unit: string;
  threshold: { good: number; poor: number };
  description: string;
  icon: React.ReactNode;
}

export default function PerformanceMonitoringDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const webVitals = useWebVitals();
  const [realtimeMetrics, setRealtimeMetrics] = useState<Metric[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !(session.user as any)?.isAdmin) {
      router.push('/admin/login');
    }
  }, [session, status, router]);

  // Process Web Vitals into displayable metrics
  useEffect(() => {
    const metrics: Metric[] = [];
    
    if (webVitals.has('FCP')) {
      const fcp = webVitals.get('FCP')!;
      metrics.push({
        name: 'First Contentful Paint',
        value: Math.round(fcp.value),
        rating: fcp.rating,
        unit: 'ms',
        threshold: { good: 1800, poor: 3000 },
        description: 'Time when the first text or image is painted',
        icon: <Clock className="w-5 h-5" />,
      });
    }
    
    if (webVitals.has('LCP')) {
      const lcp = webVitals.get('LCP')!;
      metrics.push({
        name: 'Largest Contentful Paint',
        value: Math.round(lcp.value),
        rating: lcp.rating,
        unit: 'ms',
        threshold: { good: 2500, poor: 4000 },
        description: 'Time when the largest text or image is painted',
        icon: <Layers className="w-5 h-5" />,
      });
    }
    
    if (webVitals.has('FID')) {
      const fid = webVitals.get('FID')!;
      metrics.push({
        name: 'First Input Delay',
        value: Math.round(fid.value),
        rating: fid.rating,
        unit: 'ms',
        threshold: { good: 100, poor: 300 },
        description: 'Time from user interaction to browser response',
        icon: <Timer className="w-5 h-5" />,
      });
    }
    
    if (webVitals.has('CLS')) {
      const cls = webVitals.get('CLS')!;
      metrics.push({
        name: 'Cumulative Layout Shift',
        value: cls.value,
        rating: cls.rating,
        unit: '',
        threshold: { good: 0.1, poor: 0.25 },
        description: 'Visual stability - unexpected layout shifts',
        icon: <Activity className="w-5 h-5" />,
      });
    }
    
    if (webVitals.has('TTFB')) {
      const ttfb = webVitals.get('TTFB')!;
      metrics.push({
        name: 'Time to First Byte',
        value: Math.round(ttfb.value),
        rating: ttfb.rating,
        unit: 'ms',
        threshold: { good: 800, poor: 1800 },
        description: 'Time for the server to start sending data',
        icon: <TrendingUp className="w-5 h-5" />,
      });
    }
    
    if (webVitals.has('INP')) {
      const inp = webVitals.get('INP')!;
      metrics.push({
        name: 'Interaction to Next Paint',
        value: Math.round(inp.value),
        rating: inp.rating,
        unit: 'ms',
        threshold: { good: 200, poor: 500 },
        description: 'Overall responsiveness to user interactions',
        icon: <BarChart3 className="w-5 h-5" />,
      });
    }
    
    setRealtimeMetrics(metrics);
    
    // Store historical data
    if (metrics.length > 0) {
      setHistoricalData(prev => [...prev, {
        timestamp: new Date().toISOString(),
        metrics: metrics.map(m => ({ name: m.name, value: m.value, rating: m.rating }))
      }].slice(-20)); // Keep last 20 data points
    }
  }, [webVitals]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'poor':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'needs-improvement':
        return <AlertCircle className="w-4 h-4" />;
      case 'poor':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getProgressWidth = (value: number, threshold: { good: number; poor: number }) => {
    const range = threshold.poor - threshold.good;
    const progress = ((value - threshold.good) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Performance Monitoring
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time Web Vitals and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Live Monitoring
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Core Web Vitals Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Core Web Vitals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {realtimeMetrics.map((metric) => (
              <div
                key={metric.name}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getRatingColor(metric.rating)}`}>
                      {metric.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {metric.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {metric.unit === '' ? metric.value.toFixed(3) : metric.value}
                    </span>
                    <span className="text-sm text-gray-500">
                      {metric.unit}
                    </span>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(metric.rating)}`}>
                      {getRatingIcon(metric.rating)}
                      <span className="capitalize">{metric.rating.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Good: &lt;{metric.threshold.good}{metric.unit}</span>
                    <span>Poor: &gt;{metric.threshold.poor}{metric.unit}</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                        metric.rating === 'good' ? 'bg-green-500' :
                        metric.rating === 'needs-improvement' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${getProgressWidth(metric.value, metric.threshold)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📊 Performance Testing Instructions
          </h3>
          <ol className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <div>
                <strong>Apply Database Indexes:</strong>
                <code className="block mt-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  node scripts/apply-performance-indexes.js
                </code>
              </div>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <div>
                <strong>Install Testing Dependencies:</strong>
                <code className="block mt-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  npm install --save-dev lighthouse puppeteer
                </code>
              </div>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <div>
                <strong>Run Performance Tests:</strong>
                <code className="block mt-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  node scripts/test-performance.js
                </code>
              </div>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <div>
                <strong>Manual Lighthouse Audit:</strong>
                <code className="block mt-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  npx lighthouse http://localhost:3000 --view
                </code>
              </div>
            </li>
          </ol>
        </div>

        {/* Historical Data (if any) */}
        {historicalData.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Measurements
            </h3>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Time</th>
                      {realtimeMetrics.map(m => (
                        <th key={m.name} className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">
                          {m.name.split(' ').map(w => w[0]).join('')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.slice(-5).reverse().map((data, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-3 text-gray-900 dark:text-gray-100">
                          {new Date(data.timestamp).toLocaleTimeString()}
                        </td>
                        {data.metrics.map((m: any) => (
                          <td key={m.name} className={`py-2 px-3 ${getRatingColor(m.rating)}`}>
                            {m.value}{m.name.includes('CLS') ? '' : 'ms'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
