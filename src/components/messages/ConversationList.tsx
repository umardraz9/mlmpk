'use client';

import React, { memo } from 'react';
import { Clock, Check, CheckCheck, Pin, Archive, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  messageType: 'text' | 'media';
  attachments?: string | { url: string; name?: string; type?: string }[];
  images?: string[];
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    image?: string;
  };
  lastMessage: Message | string;
  lastMessageTime?: string;
  unreadCount: number;
  messages: Message[];
  isPinned?: boolean;
  isArchived?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onPinConversation?: (conversationId: string) => void;
  onArchiveConversation?: (conversationId: string) => void;
  isLoading?: boolean;
  searchQuery?: string;
  className?: string;
}

export const ConversationList: React.FC<ConversationListProps> = memo(({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onPinConversation,
  onArchiveConversation,
  isLoading = false,
  searchQuery = '',
  className
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getLastMessagePreview = (lastMessage: Message | string) => {
    if (typeof lastMessage === 'string') return lastMessage;
    
    if (lastMessage.messageType === 'media') {
      if (lastMessage.images?.length) return '📷 Photo';
      if (lastMessage.attachments) return '📎 Attachment';
    }
    
    return lastMessage.content.length > 50 
      ? `${lastMessage.content.substring(0, 50)}...` 
      : lastMessage.content;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getLastMessagePreview(conv.lastMessage).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: pinned first, then by last message time
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    const aTime = new Date(a.lastMessageTime || '').getTime();
    const bTime = new Date(b.lastMessageTime || '').getTime();
    return bTime - aTime;
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedConversations.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Archive className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {searchQuery ? 'No conversations found' : 'No messages yet'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
          {searchQuery 
            ? 'Try adjusting your search terms'
            : 'Start a conversation with your team members'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={cn("divide-y divide-gray-100 dark:divide-gray-800", className)}>
      {sortedConversations.map((conversation) => {
        const isSelected = selectedConversationId === conversation.id;
        const lastMessagePreview = getLastMessagePreview(conversation.lastMessage);
        
        return (
          <div
            key={conversation.id}
            className={cn(
              "group relative cursor-pointer transition-all duration-200",
              "hover:bg-gray-50 dark:hover:bg-gray-800/50",
              "active:bg-gray-100 dark:active:bg-gray-800",
              isSelected && "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
            )}
            onClick={() => onSelectConversation(conversation)}
          >
            {/* Pin indicator */}
            {conversation.isPinned && (
              <div className="absolute top-2 left-2 z-10">
                <Pin className="h-3 w-3 text-blue-500 fill-current" />
              </div>
            )}

            <div className="p-4 flex items-center gap-3">
              {/* Avatar with online status */}
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-gray-200 dark:group-hover:ring-gray-700 transition-all duration-200">
                  <AvatarImage 
                    src={conversation.otherUser.image} 
                    alt={conversation.otherUser.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                    {conversation.otherUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Online status indicator */}
                {conversation.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                )}
              </div>

              {/* Conversation details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={cn(
                    "font-medium truncate transition-colors duration-200",
                    isSelected 
                      ? "text-blue-700 dark:text-blue-300" 
                      : "text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200"
                  )}>
                    {conversation.otherUser.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {conversation.lastMessageTime && (
                      <span className={cn(
                        "text-xs transition-colors duration-200",
                        isSelected 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-sm truncate transition-colors duration-200",
                    conversation.unreadCount > 0 
                      ? "text-gray-900 dark:text-white font-medium" 
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    {lastMessagePreview}
                  </p>

                  {/* Unread badge */}
                  {conversation.unreadCount > 0 && (
                    <Badge className="ml-2 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Badge>
                  )}
                </div>

                {/* Last seen for offline users */}
                {!conversation.isOnline && conversation.lastSeen && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Last seen {formatTime(conversation.lastSeen)}
                  </p>
                )}
              </div>

              {/* Actions menu (visible on hover) */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show context menu
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

ConversationList.displayName = 'ConversationList';
