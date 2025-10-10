'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// Generic loading fallback component with skeleton UI
export const LoadingFallback = ({ 
  height = '400px', 
  message = 'Loading...' 
}: { 
  height?: string; 
  message?: string;
}) => (
  <div 
    className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse"
    style={{ minHeight: height }}
  >
    <div className="text-center">
      <Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-600 animate-spin" />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
);

// Skeleton loader for list items
export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Card skeleton loader
export const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>
    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
  </div>
);

// Chart skeleton loader
export const ChartSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
  </div>
);

// Table skeleton loader
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3">
      <div className="flex space-x-4">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex space-x-4">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Custom lazy loading wrapper with error boundary
interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  props?: Record<string, any>;
}

class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-[200px] bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">Failed to load component</p>
              <p className="text-sm text-red-500 dark:text-red-300 mt-1">
                {this.state.error?.message || 'Unknown error'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  loader,
  fallback = <LoadingFallback />,
  errorFallback,
  props = {},
}) => {
  const Component = lazy(loader);

  return (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Utility function for creating lazy-loaded routes
export const createLazyRoute = (
  importPath: () => Promise<{ default: ComponentType<any> }>,
  customFallback?: React.ReactNode
) => {
  const LazyRoute = lazy(importPath);
  
  return (props: any) => (
    <Suspense fallback={customFallback || <LoadingFallback height="100vh" />}>
      <LazyRoute {...props} />
    </Suspense>
  );
};

// Preload function for critical components
export const preloadComponent = (loader: () => Promise<any>) => {
  // Start loading the component in the background
  loader().catch((error) => {
    console.error('Failed to preload component:', error);
  });
};

// Intersection Observer hook for lazy loading on scroll
export const useLazyLoad = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  options?: IntersectionObserverInit
) => {
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callback();
        observer.disconnect();
      }
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, callback, options]);
};
