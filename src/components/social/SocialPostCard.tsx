'use client';

import React, { memo, useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Trophy, Zap, CheckCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SocialPost {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    level: number;
    verified: boolean;
  };
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaUrls?: string[];
  type: 'achievement' | 'tip' | 'success' | 'general' | 'announcement' | 'reel';
  createdAt: Date;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
}

interface SocialPostCardProps {
  post: SocialPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (post: SocialPost) => void;
  onLoadComments: (postId: string) => void;
  showComments?: boolean;
}

export const SocialPostCard: React.FC<SocialPostCardProps> = memo(({
  post,
  onLike,
  onComment,
  onShare,
  onLoadComments,
  showComments = false
}) => {
  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }, []);

  const getPostTypeConfig = useCallback((type: string) => {
    const configs = {
      achievement: { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Achievement' },
      tip: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Tip' },
      success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Success' },
      announcement: { icon: Globe, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Announcement' },
      general: { icon: MessageCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'General' }
    };
    return configs[type as keyof typeof configs] || configs.general;
  }, []);

  const typeConfig = getPostTypeConfig(post.type);
  const TypeIcon = typeConfig.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border hover:shadow-md transition-shadow duration-200">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {post.author.name}
                </h3>
                {post.author.verified && (
                  <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    ✓ Verified
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Level {post.author.level}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{post.author.username}</span>
                <span>•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <TypeIcon className={`h-3 w-3 ${typeConfig.color}`} />
                  <span className="capitalize">{post.type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Post Media */}
        {post.imageUrl && (
          <div className="mb-4">
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full h-64 object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        )}

        {/* Post Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <span>{post.likes} likes</span>
            <span>{post.comments} comments</span>
            <span>{post.shares} shares</span>
          </div>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id)}
              className={cn(
                "text-gray-700 dark:text-gray-300 hover:text-red-500",
                post.isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4 mr-1", post.isLiked && "fill-current")} />
              Like
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(post.id)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-500"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Comment
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(post)}
              className="text-gray-700 dark:text-gray-300 hover:text-green-500"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
          {post.comments > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLoadComments(post.id)}
              className="text-gray-700 dark:text-gray-300"
            >
              {showComments ? 'Hide Comments' : `View Comments (${post.comments})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

SocialPostCard.displayName = 'SocialPostCard';
