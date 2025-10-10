import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import {
  MessageCircle,
  Share2,
  MoreHorizontal,
  ThumbsUp,
  Globe,
  Pin,
  Bookmark,
  BellOff,
  Edit3,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const MediaModal = dynamic(() => import('./MediaModal'), {
  ssr: false,
  loading: () => null
});

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

interface FacebookPost {
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
  isSaved?: boolean;
  isPinned?: boolean;
  recentLikes?: Array<{
    userId: string;
    name: string;
    avatar: string;
  }>;
  recentComments?: Comment[];
}

interface FacebookPostCardProps {
  post: FacebookPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (post: FacebookPost) => void;
}

export default function FacebookPostCard({ post, onLike, onComment, onShare }: FacebookPostCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showAllComments, setShowAllComments] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(!!post.isSaved);
  const [isPinned, setIsPinned] = useState(!!post.isPinned);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(post.content);
  const [content, setContent] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const handleMediaClick = (index: number) => {
    setSelectedMediaIndex(index);
    setMediaModalOpen(true);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const handleLike = () => {
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
    onLike?.(post.id);
  };

  const handleComment = () => {
    if (!commentInput.trim()) return;
    onComment?.(post.id, commentInput);
    setCommentInput('');
  };

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

  // styling helper removed (unused)

  return (
    <>
      <Card className="mb-6 bg-white border-0 shadow-lg rounded-xl hover:shadow-xl transition-all duration-200">
        <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center space-x-3">
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  const profileId = post.author.username || post.author.id;
                  if (profileId) router.push(`/social/profile/${profileId}`);
                }}
                title={`View ${post.author.name}'s profile`}
                aria-label="View author profile"
              >
                <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {post.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="text-base font-semibold text-gray-900 hover:text-blue-600"
                    onClick={() => {
                      const profileId = post.author.username || post.author.id;
                      if (profileId) router.push(`/social/profile/${profileId}`);
                    }}
                    title={`View ${post.author.name}'s profile`}
                    aria-label="View author profile"
                  >
                    {post.author.name}
                  </button>
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
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Post options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/social/posts/${post.id}/pin`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: isPinned ? 'unpin' : 'pin' })
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setIsPinned(!isPinned);
                          toast.success(data.message || (isPinned ? 'Post unpinned' : 'Post pinned'));
                        } else {
                          toast.error(data.error || 'Failed to update pin');
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to update pin');
                      } finally {
                        setMenuOpen(false);
                      }
                    }}
                  >
                    <Pin className="h-4 w-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-800">{isPinned ? 'Unpin post' : 'Pin post'}</span>
                  </button>

                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/social/posts/${post.id}/favorite`, { method: 'POST' });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setIsSaved(data.isSaved);
                          toast.success(data.message || (data.isSaved ? 'Saved post' : 'Removed from saved'));
                        } else {
                          toast.error(data.error || 'Failed to update saved');
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to update saved');
                      } finally {
                        setMenuOpen(false);
                      }
                    }}
                  >
                    <Bookmark className="h-4 w-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-800">{isSaved ? 'Unsave post' : 'Save post'}</span>
                  </button>

                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
                    onClick={() => {
                      setEditValue(content);
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                  >
                    <Edit3 className="h-4 w-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-800">Edit post</span>
                  </button>

                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(`/messages/${post.author.id}`);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-800">Message author</span>
                  </button>

                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/social/posts/${post.id}/mute`, { method: 'POST' });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          toast.success(data.message || 'Updated notifications');
                        } else {
                          toast.error(data.error || 'Failed to update notifications');
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to update notifications');
                      } finally {
                        setMenuOpen(false);
                      }
                    }}
                  >
                    <BellOff className="h-4 w-4 text-gray-700" />
                    <span className="text-sm font-medium text-gray-800">Turn off notifications for this post</span>
                  </button>

                  <div className="h-px bg-gray-200" />

                  <button
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-left"
                    onClick={async () => {
                      if (!window.confirm('Delete this post? This cannot be undone.')) return;
                      try {
                        const res = await fetch(`/api/social/posts/${post.id}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          toast.success('Post deleted');
                          window.location.reload();
                        } else {
                          toast.error(data.error || 'Failed to delete post');
                        }
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to delete post');
                      } finally {
                        setMenuOpen(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-600">Delete post</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-6 pb-4">
          {!isEditing ? (
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base">{content}</p>
          ) : (
            <div className="space-y-3">
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                aria-label="Edit post content"
                placeholder="Update your post..."
              />
              <div className="flex items-center gap-2">
                <Button
                  disabled={savingEdit || editValue.trim().length === 0}
                  onClick={async () => {
                    try {
                      setSavingEdit(true);
                      const res = await fetch(`/api/social/posts/${post.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: editValue })
                      });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        setContent(editValue);
                        setIsEditing(false);
                      } else {
                        toast.error(data.error || 'Failed to update post');
                      }
                    } catch (err) {
                      console.error(err);
                      toast.error('Failed to update post');
                    } finally {
                      setSavingEdit(false);
                    }
                  }}
                >
                  Save
                </Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {post.type !== 'general' && (
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
              <span className="text-lg">{getPostTypeIcon(post.type)}</span>
              <span className="text-blue-700 font-medium">
                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* Post Media */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="px-6 pb-4">
            {(() => {
              const count = post.mediaUrls!.length;
              const gridBase = 'grid gap-2 rounded-xl overflow-hidden bg-gray-100';
              const gridClass =
                count === 1
                  ? 'grid-cols-1 h-80 sm:h-96'
                  : count === 2
                  ? 'grid-cols-2 h-64 sm:h-80'
                  : 'grid-cols-2 grid-rows-2 h-72 sm:h-96';

              return (
                <div className={`${gridBase} ${gridClass}`}>
                  {post.mediaUrls.slice(0, 4).map((url, index) => {
                    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
                    const isLast = index === 3 && count > 4;

                    return (
                      <div
                        key={index}
                        className="relative w-full h-full overflow-hidden rounded-lg group"
                        role="button"
                        aria-label={`Open media ${index + 1}`}
                        onClick={() => handleMediaClick(index)}
                      >
                        {isVideo ? (
                          <video
                            src={url}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={url}
                            alt={`Media ${index + 1}`}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}

                        {/* Play indicator for videos */}
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                            <div className="bg-white/90 rounded-full p-2">
                              <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* +N overlay for extra media */}
                        {isLast && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-white font-bold text-2xl block">+{count - 4}</span>
                              <span className="text-white text-sm">more</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Media indicators for multiple files */}
            {post.mediaUrls.length > 1 && (
              <div className="flex justify-center mt-3 space-x-2">
                {post.mediaUrls.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleMediaClick(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedMediaIndex ? 'bg-blue-600 w-5' : 'bg-gray-300'
                    }`}
                    aria-label={`Open media ${index + 1}`}
                  />
                ))}
                {post.mediaUrls.length > 5 && (
                  <span className="text-sm text-gray-500 ml-2">+{post.mediaUrls.length - 5} more</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Engagement Stats */}
        {(likesCount > 0 || post.comments > 0 || post.shares > 0) && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-6">
                {likesCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      <div className="h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                        </svg>
                      </div>
                      {likesCount > 1 && (
                        <div className="h-5 w-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-xs text-white font-bold">+</span>
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{likesCount}</span>
                  </div>
                )}
                {post.comments > 0 && (
                  <span className="font-medium text-blue-600">{post.comments} comments</span>
                )}
                {post.shares > 0 && (
                  <span className="font-medium text-green-600">{post.shares} shares</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-around">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 text-gray-600 hover:bg-white hover:text-blue-600 transition-colors px-4 py-2 rounded-lg ${
                isLiked ? 'text-blue-600 bg-blue-50' : ''
              }`}
            >
              <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">Like</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:bg-white hover:text-green-600 transition-colors px-4 py-2 rounded-lg"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">Comment</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare?.(post)}
              className="flex items-center space-x-2 text-gray-600 hover:bg-white hover:text-purple-600 transition-colors px-4 py-2 rounded-lg"
            >
              <Share2 className="h-5 w-5" />
              <span className="font-medium">Share</span>
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Recent Comments */}
            {post.recentComments && post.recentComments.length > 0 && (
              <div className="space-y-4 mb-6">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Comments ({post.comments})
                </h4>
                {post.recentComments.slice(0, showAllComments ? undefined : 2).map((comment) => (
                  <div key={comment.id} className="flex space-x-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <div
                      className="relative cursor-pointer"
                      onClick={() => {
                        const profileId = comment.user.username || comment.user.id;
                        if (profileId) router.push(`/social/profile/${profileId}`);
                      }}
                      title={`View ${comment.user.name}'s profile`}
                      aria-label="View commenter profile"
                    >
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={comment.user.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                          {comment.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online status for comment author */}
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <button
                          type="button"
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                          onClick={() => {
                            const profileId = comment.user.username || comment.user.id;
                            if (profileId) router.push(`/social/profile/${profileId}`);
                          }}
                          title={`View ${comment.user.name}'s profile`}
                          aria-label="View commenter profile"
                        >
                          {comment.user.name}
                        </button>
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

                {post.recentComments.length > 2 && !showAllComments && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllComments(true)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium"
                  >
                    View all {post.comments} comments
                  </Button>
                )}
              </div>
            )}

            {/* Comment Input */}
            <div className="flex space-x-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {/* Current user online status */}
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 flex space-x-3">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={!commentInput.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <MediaModal
      isOpen={mediaModalOpen}
      onClose={() => setMediaModalOpen(false)}
      mediaUrls={post.mediaUrls || []}
      initialIndex={selectedMediaIndex}
      post={post}
      onLike={onLike}
      onComment={onComment}
      onShare={onShare}
    />
    </>
  );
}
