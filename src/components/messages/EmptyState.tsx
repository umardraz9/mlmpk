'use client';

import React, { memo } from 'react';
import { MessageSquare, Users, Search, Settings, Bell, Zap } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-conversations' | 'no-messages' | 'search-empty' | 'select-conversation';
  searchQuery?: string;
  onStartConversation?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = memo(({
  type,
  searchQuery,
  onStartConversation,
  className
}) => {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-conversations':
        return {
          icon: MessageSquare,
          title: 'No conversations yet',
          description: 'Start connecting with your team members and build meaningful relationships.',
          actionText: 'Start a conversation',
          action: onStartConversation,
          showSuggestions: true
        };
      
      case 'select-conversation':
        return {
          icon: MessageSquare,
          title: 'Your messages live here',
          description: 'Select a conversation from the list to view your messages and start chatting.',
          actionText: null,
          action: null,
          showSuggestions: false
        };
      
      case 'no-messages':
        return {
          icon: Users,
          title: 'No messages in this conversation',
          description: 'Send your first message to start the conversation.',
          actionText: null,
          action: null,
          showSuggestions: false
        };
      
      case 'search-empty':
        return {
          icon: Search,
          title: 'No results found',
          description: searchQuery 
            ? `No conversations found for "${searchQuery}". Try different keywords.`
            : 'Try adjusting your search terms.',
          actionText: null,
          action: null,
          showSuggestions: false
        };
      
      default:
        return {
          icon: MessageSquare,
          title: 'Nothing here',
          description: 'There\'s nothing to show right now.',
          actionText: null,
          action: null,
          showSuggestions: false
        };
    }
  };

  const { icon: Icon, title, description, actionText, action, showSuggestions } = getEmptyStateContent();

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      {/* Icon */}
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {/* Action Button */}
      {actionText && action && (
        <button
          onClick={action}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Zap className="h-4 w-4" />
          {actionText}
        </button>
      )}

      {/* Additional suggestions */}
      {showSuggestions && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <Users className="h-6 w-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
              Find Team Members
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Browse your team directory
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
              Get Notifications
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Stay updated on messages
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
              Customize Settings
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Personalize your experience
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
