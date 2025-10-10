'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageCircle,
  Share2,
  ThumbsUp,
  Globe,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
  X
} from 'lucide-react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrls: string[];
  initialIndex?: number;
  post?: {
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
    type: 'achievement' | 'tip' | 'success' | 'general' | 'announcement' | 'reel';
    createdAt: Date;
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
  };
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (post: MediaModalProps['post']) => void;
}

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

function MediaModal({
  isOpen,
  onClose,
  mediaUrls,
  initialIndex = 0,
  post,
  onLike,
  onComment,
  onShare
}: MediaModalProps) {
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [likesCount, setLikesCount] = useState(post?.likes || 0);
  const [showComments, setShowComments] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'portrait' | 'landscape' | 'square'>('landscape');
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load comments when modal opens
  const loadComments = useCallback(async () => {
    if (!post?.id) return;

    setCommentLoading(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}/comments`);
      const data = await res.json();
      setComments(data?.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  }, [post?.id]);

  useEffect(() => {
    if (isOpen && showComments) {
      loadComments();
    }
  }, [isOpen, showComments, loadComments]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(initialIndex);
      setComments([]);
      setCommentText('');
      setIsLiked(post?.isLiked || false);
      setLikesCount(post?.likes || 0);
      setShowComments(true);
      setIsFullscreen(false);
      setVideoMuted(false);
    }
  }, [isOpen, initialIndex, post]);

  // (moved into useCallback above)

  const handleLike = () => {
    if (!post?.id) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
    onLike?.(post.id);
  };

  const handleComment = () => {
    if (!post?.id || !commentText.trim()) return;

    onComment?.(post.id, commentText);
    setCommentText('');
    // Refresh comments after posting
    setTimeout(loadComments, 500);
  };

  const handleShare = () => {
    if (!post) return;
    onShare?.(post);
  };

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(prev => prev > 0 ? prev - 1 : mediaUrls.length - 1);
    } else {
      setCurrentIndex(prev => prev < mediaUrls.length - 1 ? prev + 1 : 0);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMute = () => {
    setVideoMuted(!videoMuted);
    if (videoRef.current) {
      videoRef.current.muted = !videoMuted;
    }
  };

  // Detect video aspect ratio
  const detectVideoAspectRatio = (video: HTMLVideoElement) => {
    const aspectRatio = video.videoWidth / video.videoHeight;
    if (aspectRatio < 0.8) {
      setVideoAspectRatio('portrait'); // TikTok/Reel style
    } else if (aspectRatio > 1.3) {
      setVideoAspectRatio('landscape');
    } else {
      setVideoAspectRatio('square');
    }
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const dx = touchStart - touchEnd;
    const dy = touchStartY - touchEndY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Only treat as swipe when horizontal movement is dominant
    if (absDx > 50 && absDx > absDy) {
      if (dx > 0 && currentIndex < mediaUrls.length - 1) {
        navigateMedia('next');
      } else if (dx < 0 && currentIndex > 0) {
        navigateMedia('prev');
      }
    }

    setTouchStart(0);
    setTouchEnd(0);
    setTouchStartY(0);
    setTouchEndY(0);
  };

  // Recompute video orientation when current media changes
  useEffect(() => {
    const url = mediaUrls[currentIndex];
    const isVid = /(\.(mp4|webm|ogg|mov))$/i.test(url);
    if (!isVid) return;

    const v = videoRef.current;
    if (!v) return;

    const tryDetect = () => detectVideoAspectRatio(v);
    if (v.readyState >= 1) {
      tryDetect();
    } else {
      v.addEventListener('loadedmetadata', tryDetect, { once: true });
    }
  }, [currentIndex, mediaUrls]);

  const getPostTypeIcon = (type: string) => {
    const icons = {
      achievement: '🏆',
      tip: '💡',
      success: '✅',
      announcement: '📢',
      general: '💬',
      reel: '🎥'
    };
    return icons[type as keyof typeof icons] || '💬';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  if (!post) return null;

  const currentMedia = mediaUrls[currentIndex];
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(currentMedia);

  // Get container classes based on video aspect ratio
  const getMediaContainerClass = () => {
    if (!isVideo) return 'w-full h-full flex items-center justify-center';
    
    if (videoAspectRatio === 'portrait') {
      // TikTok/Reel style - portrait video
      return 'w-full h-full flex items-center justify-center max-w-[500px] mx-auto';
    } else if (videoAspectRatio === 'landscape') {
      // Landscape video - full width
      return 'w-full h-full flex items-center justify-center';
    } else {
      // Square video
      return 'w-full h-full flex items-center justify-center max-w-[90vh] mx-auto';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`p-0 bg-black border-0 ${isFullscreen ? 'fixed inset-0 max-w-none max-h-none rounded-none' : 'max-w-7xl w-[95vw] h-[90vh] sm:w-full'}`}>
        <div className="flex flex-col lg:flex-row h-full">
          {/* Main Media Area */}
          <div 
            className={`relative ${isFullscreen ? 'flex-1' : 'flex-1 lg:flex-[2]'} bg-black flex items-center justify-center overflow-hidden`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Media Display */}
            <div className={getMediaContainerClass()}>
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={currentMedia}
                  className={`${videoAspectRatio === 'portrait' ? 'h-full w-auto max-h-[90vh]' : 'w-full h-auto max-h-full'} rounded-lg`}
                  controls
                  autoPlay
                  muted={videoMuted}
                  loop
                  playsInline
                  onLoadedMetadata={(e) => detectVideoAspectRatio(e.currentTarget)}
                />
              ) : (
                <img
                  src={currentMedia}
                  alt={`Media ${currentIndex + 1}`}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                />
              )}
            </div>

            {/* Media Navigation - Desktop & Mobile */}
            {mediaUrls.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white border-0 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 z-10 touch-manipulation"
                  onClick={() => navigateMedia('prev')}
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white border-0 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 z-10 touch-manipulation"
                  onClick={() => navigateMedia('next')}
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>

                {/* Media Counter */}
                <div className="absolute bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-10">
                  {currentIndex + 1} / {mediaUrls.length}
                </div>

                {/* Dot Indicators for Mobile */}
                <div className="absolute bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {mediaUrls.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all touch-manipulation ${
                        idx === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                      aria-label={`Go to media ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Close Button - Top Left */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/60 hover:bg-black/80 text-white border-0 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 z-10 touch-manipulation"
              onClick={onClose}
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>

            {/* Fullscreen Toggle - Top Right */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/60 hover:bg-black/80 text-white border-0 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 z-10 touch-manipulation lg:flex hidden"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>

            {/* Video Mute Toggle - Mobile Friendly */}
            {isVideo && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 sm:top-4 right-14 sm:right-20 bg-black/60 hover:bg-black/80 text-white border-0 rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 z-10 touch-manipulation"
                onClick={toggleMute}
              >
                {videoMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            )}
          </div>

          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <div className={`w-full lg:w-96 bg-white border-t lg:border-l lg:border-t-0 ${isFullscreen ? 'hidden' : 'flex'} flex-col max-h-[40vh] lg:max-h-full overflow-y-auto lg:h-full`}>

            {/* Post Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Author Info */}
              <div className="p-4 border-b">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {post.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {post.author.name}
                      </h3>
                      {post.author.verified && (
                        <span className="text-blue-500 bg-blue-50 p-1 rounded-full">✓</span>
                      )}
                      <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full font-medium">
                        Level {post.author.level}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{formatTimeAgo(post.createdAt)}</span>
                      <span className="text-gray-300">•</span>
                      <Globe className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <p className="text-gray-900 leading-relaxed text-sm mb-3">{post.content}</p>

                {post.type !== 'general' && (
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
                    <span className="text-base">{getPostTypeIcon(post.type)}</span>
                    <span className="text-blue-700 font-medium text-sm">
                      {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Engagement Stats */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">{likesCount} likes</span>
                    <span className="font-medium text-blue-600">{post.comments} comments</span>
                    <span className="font-medium text-green-600">{post.shares} shares</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isLiked ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium">Like</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="font-medium">Comment</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <Share2 className="h-5 w-5" />
                    <span className="font-medium">Share</span>
                  </Button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments && (
                <div className="p-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    Comments ({post.comments})
                  </h4>

                  {commentLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="space-y-4 mb-4">
                      {comments.slice(0, 5).map((comment) => (
                        <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                            <AvatarImage src={comment.user.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                              {comment.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">
                                {comment.user.name}
                              </span>
                              {comment.user.verified && (
                                <span className="text-blue-500 bg-blue-50 p-0.5 rounded-full text-xs">✓</span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}

                      {comments.length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-lg font-medium"
                        >
                          View all {post.comments} comments
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
                  )}

                  {/* Comment Input */}
                  <div className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                      <AvatarImage src={session?.user?.image || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                        {session?.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 bg-white border border-gray-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                      />
                      <Button
                        size="sm"
                        onClick={handleComment}
                        disabled={!commentText.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-full"
                      >
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MediaModal;
export { MediaModal };
