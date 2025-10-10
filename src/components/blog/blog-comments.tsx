'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageCircle, Flag } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    image?: string | null;
  };
  likes: number;
  replies: Comment[];
}

interface BlogCommentsProps {
  comments: Comment[];
  postId: string;
}

export default function BlogComments({ comments, postId }: BlogCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [showReply, setShowReply] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      // Here you would typically send the comment to your backend
      console.log('New comment:', newComment);
      setNewComment('');
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`space-y-4 ${isReply ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.author.image || undefined} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{comment.author.name}</h4>
            <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>
          
          <p className="text-gray-700 mb-3">{comment.content}</p>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-500 hover:text-blue-600"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{comment.likes}</span>
            </Button>
            
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReply(showReply === comment.id ? null : comment.id)}
                className="text-gray-500 hover:text-blue-600"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600"
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
          
          {showReply === comment.id && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <textarea
                placeholder="Write a reply..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReply(null)}
                >
                  Cancel
                </Button>
                <Button size="sm">
                  Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">
          Comments ({comments.length})
        </h3>
        <Badge variant="outline" className="text-sm">
          Latest
        </Badge>
      </div>
      
      {/* Add Comment Form */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/api/placeholder/40/40" alt="You" />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="outline"
                  onClick={() => setNewComment('')}
                  disabled={!newComment.trim()}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                >
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Comments List */}
      <div className="space-y-6">
        {comments.map(comment => renderComment(comment))}
      </div>
      
      {comments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
} 