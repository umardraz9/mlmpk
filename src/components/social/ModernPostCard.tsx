'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  Play,
  Volume2,
  VolumeX,
  Bookmark,
  Flag,
  Eye,
  Calendar,
  MapPin,
  Trophy,
  Zap,
  CheckCircle,
  Globe,
  Loader2
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    level: number;
    verified: boolean;
  };
}

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
  coverUrl?: string;
  type: 'achievement' | 'tip' | 'success' | 'general' | 'announcement' | 'reel';
  createdAt: Date;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  recentLikes?: Array<{
    userId: string;
    name: string;
    avatar: string;
  }>;
  recentComments?: Comment[];
}

interface ModernPostCardProps {
  post: SocialPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (post: SocialPost) => void;
}

export default function ModernPostCard({ post, onLike, onComment, onShare }: ModernPostCardProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const getPostTypeConfig = (type: string) => {
    const configs = {
      achievement: { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Achievement', gradient: 'from-yellow-400 to-yellow-600' },
      tip: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Tip', gradient: 'from-blue-400 to-blue-600' },
      success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Success', gradient: 'from-green-400 to-green-600' },
      announcement: { icon: Globe, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Announcement', gradient: 'from-purple-400 to-purple-600' },
      general: { icon: MessageCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'General', gradient: 'from-gray-400 to-gray-600' },
      reel: { icon: Play, color: 'text-pink-600', bg: 'bg-pink-100', label: 'Reel', gradient: 'from-pink-400 to-pink-600' }
    };
    return configs[type as keyof typeof configs] || configs.general;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleLike = () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
    onLike?.(post.id);
  };

  const handleComment = async () => {
    if (!commentInput.trim()) return;

    setIsCommenting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCommentsCount(prev => prev + 1);
      setCommentInput('');
      onComment?.(post.id, commentInput);
    } catch (error) {
      console.error('Failed to comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = () => {
    onShare?.(post);
  };

  const typeConfig = getPostTypeConfig(post.type);
  const TypeIcon = typeConfig.icon;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white overflow-hidden">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-social-gradient-from to-social-gradient-to text-white">
              {post.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {post.author.name}
              </button>
              {post.author.verified && (
                <CheckCircle className="h-4 w-4 text-blue-500" />
              )}
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                L{post.author.level}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="truncate">@{post.author.username}</span>
              <span>•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${typeConfig.bg}`}>
              <TypeIcon className={`h-3 w-3 ${typeConfig.color}`} />
              <span className={`text-xs font-medium ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Media Content */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mb-4">
            <div className={`grid gap-2 rounded-xl overflow-hidden ${
              post.mediaUrls.length === 1 ? 'grid-cols-1' :
              post.mediaUrls.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {post.mediaUrls.slice(0, 4).map((url, index) => {
                const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
                const isLast = index === 3 && post.mediaUrls.length > 4;

                return (
                  <div key={index} className="relative group">
                    {isVideo ? (
                      <video
                        src={url}
                        controls
                        muted={isMuted}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}

                    {/* Video controls overlay */}
                    {isVideo && (
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white"
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        </Button>
                      </div>
                    )}

                    {/* More images indicator */}
                    {isLast && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                        <span className="text-white font-semibold">
                          +{post.mediaUrls.length - 4} more
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reel Content */}
        {post.type === 'reel' && post.videoUrl && (
          <div className="mb-4 relative group">
            <div className="relative bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 rounded-xl overflow-hidden aspect-[9/16] max-w-sm mx-auto">
              {(() => {
                // Safely handle reelMeta whether it's already an object or a JSON string
                const rawReelMeta = (post as any).reelMeta;
                const reelMeta = typeof rawReelMeta === 'string'
                  ? (() => { try { return JSON.parse(rawReelMeta); } catch { return null; } })()
                  : (rawReelMeta || null);
                const platform = reelMeta?.platform || 'direct';

                if (platform === 'youtube') {
                  const videoId = post.videoUrl.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
                  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

                  return (
                    <>
                      <img
                        src={thumbnailUrl}
                        alt="YouTube thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = post.coverUrl || '/api/placeholder/200/350';
                        }}
                      />
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-600 text-white">YouTube</Badge>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <>
                      {post.coverUrl ? (
                        <img src={post.coverUrl} alt="Reel cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-16 w-16 text-white" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                          Reel
                        </Badge>
                      </div>
                    </>
                  );
                }
              })()}

              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 text-gray-900 fill-current" />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-medium drop-shadow-lg line-clamp-2">
                  {post.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 transition-all duration-200 ${
                isLiked ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Heart className={`h-4 w-4 transition-all duration-200 ${isLiked ? 'fill-current scale-110' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all duration-200"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">{commentsCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-all duration-200"
            >
              <Share2 className="h-4 w-4" />
              <span className="font-medium">{post.shares}</span>
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
            {/* Recent Comments */}
            {post.recentComments && post.recentComments.length > 0 && (
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-medium text-gray-900">Recent Comments</h4>
                {post.recentComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={comment.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {comment.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user.name}
                        </span>
                        {comment.user.verified && (
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          L{comment.user.level}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-social-gradient-from to-social-gradient-to text-white text-sm">
                  {session?.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="min-h-[60px] resize-none border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                />
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={isCommenting || !commentInput.trim()}
                  className="bg-gradient-to-r from-social-gradient-from to-social-gradient-to hover:from-social-gradient-to hover:to-social-gradient-from text-white"
                >
                  {isCommenting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
