'use client';

import { FileQuestion, Home, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SocialNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Social Page Not Found</CardTitle>
          <CardDescription>
            The social page you're looking for doesn't exist or may have been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 text-center">
            This could happen if:
          </div>
          <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
            <li>The social page was deleted</li>
            <li>The URL was typed incorrectly</li>
            <li>The page was moved to a different location</li>
          </ul>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => window.location.href = '/social'}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Go to Social Hub
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
