'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MessageSquare, Users, Send, RefreshCw, CheckCircle, 
  XCircle, AlertTriangle, Info, Trash2, Reply, Forward, 
  Edit, MoreVertical, Heart, ThumbsUp, Laugh, Zap, 
  Frown, Angry, Copy, Check, CheckCheck, Clock, UserX, X
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: string;
  status: string;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  recipient: {
    id: string;
    name: string;
    avatar?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  reactions?: {
    id: string;
    reaction: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }[];
  forwardedFrom?: {
    id: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
}

interface EnhancedMessageComponentProps {
  message: Message;
  onReply: (messageId: string, content: string) => Promise<void>;
  onForward: (messageId: string, recipientIds: string[], additionalMessage?: string) => Promise<void>;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string, type: 'soft' | 'hard') => Promise<void>;
  onBlock: (userId: string, reason?: string) => Promise<void>;
  onReact: (messageId: string, reaction: string) => Promise<void>;
  onRemoveReaction: (messageId: string) => Promise<void>;
  availableUsers: User[];
}

const reactions = [
  { emoji: '👍', name: 'like', icon: ThumbsUp },
  { emoji: '❤️', name: 'love', icon: Heart },
  { emoji: '😂', name: 'laugh', icon: Laugh },
  { emoji: '⚡️', name: 'wow', icon: Zap },
  { emoji: '😢', name: 'sad', icon: Frown },
  { emoji: '😠', name: 'angry', icon: Angry }
];

export default function EnhancedMessageComponent({
  message,
  onReply,
  onForward,
  onEdit,
  onDelete,
  onBlock,
  onReact,
  onRemoveReaction,
  availableUsers
}: EnhancedMessageComponentProps) {
  const { data: session } = useSession();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(message.content);
  const [forwardRecipients, setForwardRecipients] = useState<string[]>([]);
  const [forwardMessage, setForwardMessage] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  const isOwnMessage = message.senderId === session?.user?.id;
  const canEdit = isOwnMessage && !message.isEdited && 
    (new Date().getTime() - new Date(message.createdAt).getTime()) < 24 * 60 * 60 * 1000;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setShowContextMenu(false);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleReply = async () => {
    if (replyContent.trim()) {
      await onReply(message.id, replyContent);
      setReplyContent('');
      setShowReplyDialog(false);
    }
  };

  const handleForward = async () => {
    if (forwardRecipients.length > 0) {
      await onForward(message.id, forwardRecipients, forwardMessage || undefined);
      setForwardRecipients([]);
      setForwardMessage('');
      setShowForwardDialog(false);
    }
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await onEdit(message.id, editContent);
      setShowEditDialog(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(message.id, deleteType);
    setShowDeleteDialog(false);
  };

  const handleBlock = async () => {
    await onBlock(message.senderId, blockReason || undefined);
    setBlockReason('');
    setShowBlockDialog(false);
  };

  const handleReaction = async (reaction: string) => {
    const existingReaction = message.reactions?.find(r => r.user.id === session?.user?.id);
    
    if (existingReaction && existingReaction.reaction === reaction) {
      await onRemoveReaction(message.id);
    } else {
      await onReact(message.id, reaction);
    }
    setShowReactionPicker(false);
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.reaction]) {
      acc[reaction.reaction] = [];
    }
    acc[reaction.reaction].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>) || {};

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 relative`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        <Card className={`p-3 ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-white'}`}>
          {/* Reply Context */}
          {message.replyTo && (
            <div className="mb-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
              <div className="font-medium">{message.replyTo.sender.name}</div>
              <div className="truncate">{message.replyTo.content}</div>
            </div>
          )}

          {/* Forwarded Context */}
          {message.forwardedFrom && (
            <div className="mb-2 text-xs opacity-75">
              <Forward className="w-3 h-3 inline mr-1" />
              Forwarded from {message.forwardedFrom.sender.name}
            </div>
          )}

          {/* Message Content */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm">{message.content}</p>
              {message.isEdited && (
                <span className="text-xs opacity-75 italic">(edited)</span>
              )}
            </div>

            {/* Context Menu Button */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 ml-2"
                onClick={() => setShowContextMenu(!showContextMenu)}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>

              {/* Context Menu */}
              {showContextMenu && (
                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-32">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center text-gray-700"
                    onClick={() => {
                      setShowReactionPicker(true);
                      setShowContextMenu(false);
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    React
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center text-gray-700"
                    onClick={() => {
                      setShowReplyDialog(true);
                      setShowContextMenu(false);
                    }}
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center text-gray-700"
                    onClick={() => {
                      setShowForwardDialog(true);
                      setShowContextMenu(false);
                    }}
                  >
                    <Forward className="w-4 h-4 mr-2" />
                    Forward
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center text-gray-700"
                    onClick={handleCopyMessage}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </button>
                  {canEdit && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center text-gray-700"
                      onClick={() => {
                        setShowEditDialog(true);
                        setShowContextMenu(false);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  )}
                  {isOwnMessage && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center text-gray-700"
                      onClick={() => {
                        setShowDeleteDialog(true);
                        setShowContextMenu(false);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  )}
                  {!isOwnMessage && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center text-gray-700"
                      onClick={() => {
                        setShowBlockDialog(true);
                        setShowContextMenu(false);
                      }}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Block User
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message Info */}
          <div className="flex items-center justify-between mt-2 text-xs opacity-75">
            <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
            {isOwnMessage && (
              <div className="flex items-center space-x-1">
                {getStatusIcon()}
              </div>
            )}
          </div>
        </Card>

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(groupedReactions).map(([reaction, users]) => {
              const reactionData = reactions.find(r => r.name === reaction);
              const hasUserReacted = users.some(u => u.user.id === session?.user?.id);
              
              return (
                <Badge
                  key={reaction}
                  variant={hasUserReacted ? "default" : "secondary"}
                  className="text-xs cursor-pointer"
                  onClick={() => handleReaction(reaction)}
                >
                  {reactionData?.emoji} {users.length}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Reaction Picker */}
        {showReactionPicker && (
          <div className="flex gap-1 mt-2 p-2 bg-white border rounded-lg shadow-lg relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0"
              onClick={() => setShowReactionPicker(false)}
            >
              <X className="w-3 h-3" />
            </Button>
            {reactions.map(({ emoji, name }) => (
              <Button
                key={name}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleReaction(name)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Reply Dialog */}
      {showReplyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reply to Message</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-100 rounded">
                <div className="text-sm font-medium">{message.sender.name}</div>
                <div className="text-sm text-gray-600">{message.content}</div>
              </div>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="Type your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleReply} disabled={!replyContent.trim()}>
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Dialog */}
      {showForwardDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Forward Message</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForwardDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-100 rounded">
                <div className="text-sm text-gray-600">{message.content}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Select Recipients:</label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {availableUsers.filter(user => user.id !== session?.user?.id).map(user => (
                    <label key={user.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={forwardRecipients.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForwardRecipients([...forwardRecipients, user.id]);
                          } else {
                            setForwardRecipients(forwardRecipients.filter(id => id !== user.id));
                          }
                        }}
                      />
                      <span className="text-sm">{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                rows={2}
                placeholder="Add a message (optional)..."
                value={forwardMessage}
                onChange={(e) => setForwardMessage(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowForwardDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleForward} disabled={forwardRecipients.length === 0}>
                Forward
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Message</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEdit} 
                disabled={!editContent.trim() || editContent === message.content}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delete Message</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this message?
              </p>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="deleteType"
                    checked={deleteType === 'soft'}
                    onChange={() => setDeleteType('soft')}
                  />
                  <span className="text-sm">Hide message (can be recovered)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="deleteType"
                    checked={deleteType === 'hard'}
                    onChange={() => setDeleteType('hard')}
                  />
                  <span className="text-sm">Delete permanently</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Block Dialog */}
      {showBlockDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Block User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBlockDialog(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to block {message.sender.name}? They won't be able to send you messages.
              </p>
              <Input
                placeholder="Reason for blocking (optional)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBlock}>
                Block User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close context menu */}
      {showContextMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
}
