"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share, MoreHorizontal, Bookmark } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';

interface SocialPostProps {
  post: {
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
    comments?: number;
    shares?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
  };
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
}

export default function SocialPost({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onBookmark
}: SocialPostProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isOwnPost = currentUserId === post.author.id;
  const shouldTruncate = post.content.length > 280;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <UserAvatar
          user={post.author}
          size="lg"
          className="ring-2 ring-white shadow-sm"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">
              {post.author.name}
            </span>
            <span className="text-gray-500 text-xs">
              {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
            </span>
            {isOwnPost && (
              <span className="text-xs text-gray-400 ml-auto">(You)</span>
            )}
          </div>

          {/* User role/badge if applicable */}
          <div className="text-xs text-gray-500 mt-1">
            @{post.author.email.split('@')[0]}
          </div>
        </div>

        {/* More actions */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 min-w-32">
              {isOwnPost ? (
                <>
                  <button className="block w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
                    Edit Post
                  </button>
                  <button className="block w-full text-left px-3 py-1 text-xs text-red-600 hover:bg-gray-50">
                    Delete Post
                  </button>
                </>
              ) : (
                <>
                  <button className="block w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
                    Report Post
                  </button>
                  <button className="block w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
                    Hide Post
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className={`text-gray-800 text-sm leading-relaxed ${!showFullContent && shouldTruncate ? 'line-clamp-4' : ''}`}>
          {post.content}
        </p>

        {shouldTruncate && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-500 hover:text-blue-600 text-xs mt-1 font-medium"
          >
            {showFullContent ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Media placeholder - if you have image/video support */}
      {/* <div className="mb-4">
        {post.media && (
          <div className="rounded-lg overflow-hidden bg-gray-100">
            <img src={post.media} alt="Post media" className="w-full h-auto" />
          </div>
        )}
      </div> */}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-6">
          <button
            onClick={() => onLike?.(post.id)}
            className={`flex items-center gap-2 text-sm transition-colors ${
              post.isLiked
                ? 'text-red-500'
                : 'text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes || 0}</span>
          </button>

          <button
            onClick={() => onComment?.(post.id)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-500 text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments || 0}</span>
          </button>

          <button
            onClick={() => onShare?.(post.id)}
            className="flex items-center gap-2 text-gray-600 hover:text-green-500 text-sm transition-colors"
          >
            <Share className="w-4 h-4" />
            <span>{post.shares || 0}</span>
          </button>
        </div>

        <button
          onClick={() => onBookmark?.(post.id)}
          className={`p-1 rounded-full transition-colors ${
            post.isBookmarked
              ? 'text-yellow-500 bg-yellow-50'
              : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
