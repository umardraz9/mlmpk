/**
 * MESSAGING CACHE AND STATE MANAGEMENT FIXES
 *
 * Common issues that cause persistent empty states in messaging:
 */

import { useEffect, useState } from 'react';

// 1. FORCE REFRESH UTILITY FUNCTION
export const forceRefresh = async (url: string) => {
  const timestamp = Date.now();
  const response = await fetch(`${url}?t=${timestamp}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  return response;
};

// 2. USE FRESH DATA HOOK
export const useFreshData = <T,>(
  fetcher: () => Promise<T>,
  interval = 30000
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    // Auto-refresh every interval
    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
  }, [fetcher, interval]);

  return { data, loading, error, refresh };
};

// 3. COMMON FIXES FOR PERSISTENT EMPTY STATES:

// Fix 1: Add cache-busting to API calls
const fetchConversations = async () => {
  const response = await forceRefresh('/api/messages/conversations');
  const data = await response.json();
  return data;
};

// Fix 2: Clear local storage cache
const clearMessageCache = () => {
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('message_') || key.startsWith('conversation_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// Fix 3: Force component remount
const useForceUpdate = () => {
  const [value, setValue] = useState(0);
  return () => setValue(value => value + 1);
};

// Fix 4: Add error boundary for messaging components
export class MessageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Message component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Something went wrong
          </h3>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 4. DEBUGGING UTILITIES

// Add this to your messages page for debugging
const DebugInfo = ({ data, loading, error }: any) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs max-w-xs">
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>Error: {error || 'none'}</div>
      <div>Data items: {data?.length || 0}</div>
      <div>Timestamp: {new Date().toISOString()}</div>
    </div>
  );
};

export default DebugInfo;
