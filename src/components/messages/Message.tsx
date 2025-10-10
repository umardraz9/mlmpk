"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';

interface MessageProps {
  message: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
    timestamp: Date;
    likes?: number;
    replies?: number;
  };
  currentUserId?: string;
  onLike?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
}

export default function Message({
  message,
  currentUserId,
  onLike,
  onReply
}: MessageProps) {
  const [showActions, setShowActions] = useState(false);
  const isOwnMessage = currentUserId === message.author.id;

  return (
    <div className={`flex gap-3 p-4 hover:bg-gray-50 ${isOwnMessage ? 'ml-12' : 'mr-12'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <UserAvatar
          user={message.author}
          size="md"
          className="ring-2 ring-white shadow-sm"
        />
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">
            {message.author.name}
          </span>
          <span className="text-gray-500 text-xs">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
          {isOwnMessage && (
            <span className="text-xs text-gray-400 ml-auto">(You)</span>
          )}
        </div>

        {/* Message text */}
        <p className="text-gray-800 text-sm leading-relaxed mb-2">
          {message.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike?.(message.id)}
            className="flex items-center gap-1 text-gray-500 hover:text-red-500 text-xs transition-colors"
            aria-label="Like message"
            title="Like message"
          >
            <Heart className="w-3 h-3" />
            <span>{message.likes || 0}</span>
          </button>

          <button
            onClick={() => onReply?.(message.id)}
            className="flex items-center gap-1 text-gray-500 hover:text-blue-500 text-xs transition-colors"
            aria-label="Reply to message"
            title="Reply to message"
          >
            <MessageCircle className="w-3 h-3" />
            <span>{message.replies || 0}</span>
          </button>

          {/* More actions for own messages */}
          {isOwnMessage && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="More actions"
                title="More actions"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
                  <button className="block w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-50" aria-label="Edit message" title="Edit message">
                    Edit
                  </button>
                  <button className="block w-full text-left px-3 py-1 text-xs text-red-600 hover:bg-gray-50" aria-label="Delete message" title="Delete message">
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
