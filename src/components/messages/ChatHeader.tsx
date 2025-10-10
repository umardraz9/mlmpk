'use client';

import React, { memo } from 'react';
import { 
  ArrowLeft, 
  Search,
  Info
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  user: {
    id: string;
    name: string;
    image?: string;
  };
  isOnline?: boolean;
  lastSeen?: string;
  isTyping?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onShowInfo?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = memo(({
  user,
  isOnline = false,
  lastSeen,
  isTyping = false,
  onBack,
  onSearch,
  onShowInfo,
  showBackButton = false,
  className
}) => {
  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Active now' : `Active ${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `Active ${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `Active ${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return `Last seen ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  return (
    <div className={cn(
      "sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm",
      className
    )}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - User info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Back button (mobile) */}
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="md:hidden h-10 w-10 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            {/* Avatar with online status */}
            <div className="relative">
              <Avatar className="h-11 w-11 ring-2 ring-transparent hover:ring-blue-200 dark:hover:ring-blue-800 transition-all duration-200 cursor-pointer shadow-md">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Online status indicator */}
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 border-2 border-white dark:border-gray-900 rounded-full shadow-lg">
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                </div>
              )}
            </div>

            {/* User details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                  {user.name}
                </h2>
                {isOnline && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 text-xs px-2 py-0.5 font-medium">
                    Online
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isTyping ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-medium">
                      typing...
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isOnline ? 'Active now' : lastSeen ? formatLastSeen(lastSeen) : 'Offline'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1">
            {/* Search button */}
            {onSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSearch}
                className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
            )}

            {/* Info/More button */}
            {onShowInfo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowInfo}
                className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';
