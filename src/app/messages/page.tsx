'use client';

import { Suspense, Component, ReactNode } from 'react';
import MessagesPageOptimized from './page-optimized';
import MessagesPageFallback from './page-fallback';
import { Loader2 } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SimpleErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Messages page error boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <MessagesPageFallback />;
    }

    return this.props.children;
  }
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600 dark:text-gray-400">Loading advanced messaging features...</p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <SimpleErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <MessagesPageOptimized />
      </Suspense>
    </SimpleErrorBoundary>
  );
}
