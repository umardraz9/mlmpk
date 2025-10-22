'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ClearDemoPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const clearDemoData = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/notifications/clear-test', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setResult(`✅ SUCCESS: Cleared ${data.deletedNotifications} demo notifications and ${data.deletedMessages} demo messages`);
      } else {
        setResult(`❌ ERROR: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ ERROR: Failed to clear demo data`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Please login to clear demo data
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <Trash2 className="h-6 w-6 text-red-600" />
              <span>Clear Demo Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              This will remove all demo notifications and test messages from the database.
            </p>

            <Button
              onClick={clearDemoData}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All Demo Data</span>
                </>
              )}
            </Button>

            {result && (
              <div className={`p-3 rounded-lg ${
                result.includes('SUCCESS') 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {result.includes('SUCCESS') ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${
                    result.includes('SUCCESS') 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {result}
                  </span>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>After clearing, refresh the page to see updated notifications.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
