'use client';

import { GlobalErrorBoundary } from '@/components/global-error-boundary';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Global error handling
  useEffect(() => {
    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <GlobalErrorBoundary>
      {children}
    </GlobalErrorBoundary>
  );
}
