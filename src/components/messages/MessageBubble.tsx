'use client';
type AttachmentItem = string | {
  url?: string;
  href?: string;
  path?: string;
  name?: string;
  filename?: string;
  type?: string;
};

import React, { memo, useState, useRef, useEffect } from 'react';
import {
  Reply,
  Copy,
  Edit,
  Trash2,
  Forward,
  Check,
  CheckCheck,
  Clock,
  Heart,
  Download,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ReactionPicker } from './ReactionPicker';
import { DeleteConfirmation } from './DeleteConfirmation';
import { MessageEdit } from './MessageEdit';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { ImageModal } from './ImageModal';

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  messageType: 'text' | 'media';
  attachments?: string | { url: string; name?: string; type?: string }[];
  images?: string[];
  replyToId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  editedAt?: string;
  deletedAt?: string;
  reactions?: {
    id: string;
    emoji: string;
    user: {
      id: string;
      name: string;
    };
  }[];
  replyTo?: Message;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
  recipient: {
    id: string;
    name: string;
    image?: string;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  isGrouped?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  currentUserId?: string;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = memo(({
  message,
  isOwn,
  showAvatar = true,
  isGrouped = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
  currentUserId,
  className
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const actionsRef = useRef<HTMLDivElement>(null);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '😡'];

  // Group reactions by emoji for compact chips
  const groupedReactions = React.useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean }>();
    (message.reactions || []).forEach(r => {
      const key = r.emoji;
      const prev = map.get(key) || { count: 0, mine: false };
      map.set(key, { count: prev.count + 1, mine: prev.mine || (currentUserId ? r.user.id === currentUserId : false) });
    });
    return Array.from(map.entries()).map(([emoji, val]) => ({ emoji, ...val }));
  }, [message.reactions, currentUserId]);

  // Helper functions
  const getMessageType = (): 'text' | 'image' | 'video' | 'audio' | 'document' | 'file' => {
    if (message.images && message.images.length > 0) return 'image';
    if (message.attachments) {
      try {
        const attachments = typeof message.attachments === 'string'
          ? (message.attachments.trim() ? JSON.parse(message.attachments) : [])
          : message.attachments;

        if (Array.isArray(attachments) && attachments.length > 0) {
          const typed = attachments as AttachmentItem[];
          if (typed.some(att => typeof att !== 'string' && (att.type?.startsWith('video/') ?? false))) return 'video';
          if (typed.some(att => typeof att !== 'string' && (att.type?.startsWith('audio/') ?? false))) return 'audio';
          if (typed.some(att => typeof att !== 'string' && ((att.type?.includes('pdf') ?? false) || (att.type?.includes('document') ?? false)))) return 'document';
          return 'file';
        }
      } catch (error) {
        console.error('Error parsing attachments:', error);
      }
    }
    return 'text';
  };

  const canEdit = () => {
    if (!isOwn || message.isDeleted) return false;
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    return (now - messageTime) < fifteenMinutes && getMessageType() === 'text';
  };

  const canDeleteForEveryone = () => {
    if (!isOwn || message.isDeleted) return false;
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    return (now - messageTime) < oneHour;
  };

  const getEditTimeLeft = () => {
    if (!canEdit()) return 0;
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    return Math.max(0, Math.floor((fifteenMinutes - (now - messageTime)) / 1000));
  };

  // Image modal handlers
  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const handleNextImage = () => {
    if (message.images && currentImageIndex < message.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Event handlers
  const handleReactionSelect = (emoji: string) => {
    if (onReact) {
      onReact(message.id, emoji);
    }
    setShowReactionPicker(false);
    setShowActions(false);
  };

  const handleDeleteConfirm = (deleteType: 'delete-for-me' | 'delete-for-everyone') => {
    if (onDelete) {
      onDelete(message.id);
      // In a real implementation, you'd pass the deleteType to the backend
      console.log('Delete type:', deleteType);
    }
    setShowDeleteConfirmation(false);
    setShowActions(false);
  };

  const handleEditSave = (newContent: string) => {
    if (onEdit) {
      onEdit({ ...message, content: newContent });
    }
    setShowEditModal(false);
    setShowActions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setShowActions(false);
        setShowReactions(false);
        setShowReactionPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (message.isDeleted) {
    return (
      <div className={cn(
        "flex items-center gap-3 py-2",
        isOwn ? "justify-end" : "justify-start",
        className
      )}>
        {!isOwn && showAvatar && (
          <div className="w-8 h-8" /> // Spacer for alignment
        )}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 max-w-xs">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            This message was deleted
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatTime(message.deletedAt || message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "group relative flex items-end gap-3 py-1",
        isOwn ? "justify-end" : "justify-start",
        !isGrouped && "mt-4",
        className
      )}>
        {/* Avatar (for received messages) */}
        {!isOwn && showAvatar && (
          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-gray-200 dark:group-hover:ring-gray-700 transition-all duration-200">
            <AvatarImage src={message.sender.image} alt={message.sender.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {message.sender.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Spacer for grouped messages */}
        {!isOwn && !showAvatar && <div className="w-8" />}

        {/* Message Content */}
        <div className={cn(
          "relative max-w-xs md:max-w-md lg:max-w-lg",
          isOwn ? "order-1" : "order-2"
        )}>
          {/* Reply indicator */}
          {message.replyTo && (
            <div className={cn(
              "mb-2 p-2 rounded-lg border-l-4",
              isOwn
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            )}>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Replying to {message.replyTo.sender.name}
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                {message.replyTo.content}
              </p>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              "relative rounded-2xl px-4 py-2 shadow-sm transition-all duration-200",
              isOwn
                ? "bg-green-100 text-gray-900 ml-auto border border-green-200 dark:bg-emerald-900/30 dark:text-white dark:border-emerald-800"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700",
              "group-hover:shadow-md"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => !showReactions && setShowActions(false)}
          >
            {/* Sender name (for group chats) */}
            {!isOwn && !isGrouped && (
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {message.sender.name}
              </p>
            )}

            {/* Message content */}
            <div className="space-y-2">
              {/* Text content */}
              {message.content && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                  {message.isEdited && (
                    <span className={cn(
                      "ml-2 text-xs opacity-70",
                      isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                    )}>
                      (edited)
                    </span>
                  )}
                </p>
              )}

              {/* Images */}
              {message.images && message.images.length > 0 && (
                <div className={cn(
                  "grid gap-1 rounded-lg overflow-hidden",
                  message.images.length === 1 ? "grid-cols-1" :
                  message.images.length === 2 ? "grid-cols-2" :
                  "grid-cols-2"
                )}>
                  {message.images.slice(0, 4).map((image, index) => (
                    <div key={index} className="relative group/image">
                      <img
                        src={image}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageModal(index)}
                      />
                      {message.images!.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-medium">
                            +{message.images!.length - 4}
                          </span>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 opacity-0 group-hover/image:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(image, '_blank');
                        }}
                      >
                        <ExternalLink className="h-3 w-3 text-white" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Voice messages */}
              {getMessageType() === 'audio' && message.attachments && (
                (() => {
                  let audioFiles: AttachmentItem[] = [];
                  try {
                    audioFiles = Array.isArray(message.attachments)
                      ? message.attachments as AttachmentItem[]
                      : (typeof message.attachments === 'string'
                          ? (message.attachments.trim() ? JSON.parse(message.attachments) : [])
                          : []);
                  } catch (e) {
                    console.error('Failed to parse voice attachments', e);
                  }

                  const audioFile = audioFiles.find(file =>
                    typeof file !== 'string' && file.type?.startsWith('audio/')
                  );

                  if (audioFile) {
                    const audioUrl = typeof audioFile === 'string' ? audioFile : (audioFile.url || audioFile.href || audioFile.path || '');
                    if (audioUrl) {
                      return (
                        <VoiceMessagePlayer
                          audioUrl={audioUrl}
                          className="w-full"
                        />
                      );
                    }
                  }
                  return null;
                })()
              )}

              {/* Attachments */}
              {message.attachments && (
                (() => {
                  let files: AttachmentItem[] = [];
                  try {
                    files = Array.isArray(message.attachments)
                      ? message.attachments as AttachmentItem[]
                      : (typeof message.attachments === 'string'
                          ? (message.attachments.trim() ? JSON.parse(message.attachments) : [])
                          : []);
                  } catch (e) {
                    console.error('Failed to parse attachments', e);
                  }
                  if (!files || files.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      {files.map((file: AttachmentItem, idx: number) => {
                        const url = typeof file === 'string' ? file : (file.url || file.href || file.path || '');
                        const label = (typeof file === 'string' ? (file.split('/').pop() || 'Attachment') : (file.name || file.filename || 'Attachment')) as string;
                        if (!url) return null;
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{label}</p>
                              <p className="text-xs opacity-70">Click to download</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(url, '_blank')}
                              title="Download attachment"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Actions menu */}
            {showActions && (
              <div
                ref={actionsRef}
                className={cn(
                  "absolute top-0 flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10",
                  isOwn ? "-left-40" : "-right-40"
                )}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseEnter={() => setShowReactions(true)}
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Add reaction"
                >
                  <Heart className="h-4 w-4" />
                </Button>

                {onReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply(message)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Reply"
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Copy message"
                >
                  <Copy className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      const input = typeof window !== 'undefined' ? window.prompt('Forward to user IDs (comma separated):', '') : '';
                      const ids = (input || '')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                      if (!ids.length) return;
                      const res = await fetch('/api/messages/forward', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messageId: message.id, recipientIds: ids })
                      });
                      if (!res.ok) {
                        console.error('Forward failed');
                      }
                    } catch (e) {
                      console.error('Forward error', e);
                    }
                  }}
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Forward message"
                >
                  <Forward className="h-4 w-4" />
                </Button>

                {canEdit() && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Edit message"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    title="Delete message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Quick reactions (hover on heart) */}
            {showReactions && (
              <div className={cn(
                "absolute top-12 flex items-center gap-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20",
                isOwn ? "-left-24" : "-right-24"
              )}>
                {quickReactions.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onReact?.(message.id, emoji);
                      setShowReactions(false);
                    }}
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-lg"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Reactions (grouped chips like WhatsApp) */}
          {groupedReactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {groupedReactions.map((grp, idx) => (
                <div
                  key={`${grp.emoji}-${idx}`}
                  onClick={() => onReact?.(message.id, grp.emoji)}
                  className={cn(
                    "px-2 h-6 inline-flex items-center gap-1 rounded-full text-xs cursor-pointer",
                    "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                    grp.mine && "ring-2 ring-blue-400/60"
                  )}
                >
                  <span className="text-base leading-none">{grp.emoji}</span>
                  <span className="text-[11px] text-gray-600 dark:text-gray-300">{grp.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reaction Picker Modal */}
        <ReactionPicker
          isOpen={showReactionPicker}
          onReactionSelect={handleReactionSelect}
          onClose={() => setShowReactionPicker(false)}
          position="top"
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmation
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleDeleteConfirm}
          messageType={getMessageType()}
          isOwn={isOwn}
          canDeleteForEveryone={canDeleteForEveryone()}
        />

        {/* Edit Message Modal */}
        <MessageEdit
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          originalContent={message.content}
          canEdit={canEdit()}
          timeLeft={getEditTimeLeft()}
        />
      </div>

      {/* Image Modal */}
      {message.images && message.images.length > 0 && (
        <ImageModal
          isOpen={showImageModal}
          images={message.images}
          currentIndex={currentImageIndex}
          onClose={() => setShowImageModal(false)}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
        />
      )}
    </>
  );
});

MessageBubble.displayName = 'MessageBubble';
