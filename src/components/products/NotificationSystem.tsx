'use client';

import React, { memo, useEffect } from 'react';
import { Check, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationSystemProps {
  notification: Notification | null;
  onClose: () => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = memo(({
  notification,
  onClose
}) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <Check className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return "bg-green-500 text-white";
      case 'error':
        return "bg-red-500 text-white";
      case 'info':
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm",
      getColors()
    )}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="flex-1">{notification.message}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1 h-auto hover:bg-white/20 text-white"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

NotificationSystem.displayName = 'NotificationSystem';
