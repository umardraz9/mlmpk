'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileErrorProps {
  title?: string;
  message?: string;
  type?: 'network' | 'server' | 'notfound' | 'generic';
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
  fullScreen?: boolean;
}

export function MobileError({
  title,
  message,
  type = 'generic',
  onRetry,
  onGoHome,
  className,
  fullScreen = false
}: MobileErrorProps) {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: WifiOff,
          title: title || 'Connection Problem',
          message: message || 'Please check your internet connection and try again.',
          iconColor: 'text-orange-500'
        };
      case 'server':
        return {
          icon: AlertTriangle,
          title: title || 'Server Error',
          message: message || 'Something went wrong on our end. Please try again later.',
          iconColor: 'text-red-500'
        };
      case 'notfound':
        return {
          icon: AlertTriangle,
          title: title || 'Page Not Found',
          message: message || 'The page you\'re looking for doesn\'t exist.',
          iconColor: 'text-yellow-500'
        };
      default:
        return {
          icon: AlertTriangle,
          title: title || 'Something Went Wrong',
          message: message || 'An unexpected error occurred. Please try again.',
          iconColor: 'text-red-500'
        };
    }
  };

  const { icon: Icon, title: errorTitle, message: errorMessage, iconColor } = getErrorConfig();

  const containerClasses = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-gray-50 p-4'
    : 'flex items-center justify-center p-4 min-h-[200px]';

  return (
    <div className={cn(containerClasses, className)} role="alert" aria-live="assertive">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center p-6 space-y-4">
          <div className="flex justify-center">
            <Icon className={cn('h-16 w-16', iconColor)} aria-hidden="true" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {errorTitle}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {errorMessage}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {onGoHome && (
              <Button
                onClick={onGoHome}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline error component for smaller spaces
export function InlineError({ 
  message, 
  onRetry, 
  className 
}: { 
  message: string; 
  onRetry?: () => void; 
  className?: string; 
}) {
  return (
    <div className={cn('flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg', className)} role="alert">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Network status indicator
export function NetworkStatus({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-2 text-center text-sm" role="alert">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may not work.</span>
      </div>
    </div>
  );
}
