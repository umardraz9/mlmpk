'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <Settings className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Admin Panel Error</CardTitle>
          <CardDescription>
            Something went wrong while loading the admin dashboard. This might be due to a temporary issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Error Details:</p>
            <p className="text-xs text-gray-600 break-words">
              {error.message || 'An unexpected error occurred in the admin section'}
            </p>
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2">This error might be caused by:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Database connectivity issues</li>
              <li>Permission or authentication problems</li>
              <li>Temporary server issues</li>
              <li>Browser cache conflicts</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">
              Need immediate access?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/admin/login'}
              className="text-blue-600 hover:text-blue-700"
            >
              Admin Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
