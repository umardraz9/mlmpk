'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Smile, 
  Image, 
  Mic,
  ArrowUp,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { VoiceRecorder } from './VoiceRecorder';
import { MediaFile } from './MediaSharing';
import { EmojiPicker } from './EmojiPicker';
import { MediaSharing } from './MediaSharing';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  replyTarget?: { id: string; author: string; content: string } | null;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = memo(({
  onSendMessage,
  onTyping,
  placeholder = "Type a message...",
  disabled = false,
  className,
  replyTarget,
  onCancelReply
}) => {
  const [message, setMessage] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaSharing, setShowMediaSharing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Handle typing indicator
  useEffect(() => {
    if (onTyping && message.length > 0) {
      onTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, onTyping]);

  const handleSend = async () => {
    if ((!message.trim() && mediaFiles.length === 0) || isSending || disabled) return;

    try {
      setIsSending(true);
      const files = mediaFiles.map(mf => mf.file);
      await onSendMessage(message.trim(), files);

      setMessage('');
      setMediaFiles([]);
      setShowMediaSharing(false);
      if (onTyping) onTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMediaFilesSelect = (files: MediaFile[]) => {
    setMediaFiles(prev => [...prev, ...files]);
  };

  const handleMediaFileRemove = (fileId: string) => {
    setMediaFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessage(prev => prev + emoji);
    }
  };

  const handleVoiceRecordingComplete = async (audioBlob: Blob) => {
    setIsRecording(false);

    try {
      // Create a File object from the blob
      const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      
      // Send immediately - the normal flow will handle upload
      await onSendMessage('\ud83c\udfa4 Voice message', [audioFile]);
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  const canSend = (message.trim().length > 0 || mediaFiles.length > 0) && !isSending && !disabled;

  return (
    <div className={cn(
      "sticky bottom-0 z-50 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl",
      className
    )}>
      {/* Media Sharing Panel */}
      {showMediaSharing && (
        <div className="px-6 py-4 border-b border-gray-100/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-950/50">
          <MediaSharing
            onFilesSelect={handleMediaFilesSelect}
            onFileRemove={handleMediaFileRemove}
            selectedFiles={mediaFiles}
            maxFiles={10}
            maxFileSize={50}
            isUploading={isSending}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="p-5">
        {replyTarget && (
          <div className="mb-3 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Replying to {replyTarget.author}</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{replyTarget.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              onClick={() => onCancelReply?.()}
              title="Cancel reply"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-3">
          {/* Media & Attachment Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMediaSharing(!showMediaSharing)}
              disabled={disabled}
              className="h-11 w-11 p-0 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              title="Share media"
            >
              <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </Button>

            {/* Voice Recorder */}
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              disabled={disabled}
              className="h-11"
            />
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-[48px] max-h-[120px] resize-none border-gray-200/50 dark:border-gray-700/50",
                "focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
                "bg-gray-50/80 dark:bg-gray-800/80 rounded-2xl px-5 py-3.5 pr-14",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "transition-all duration-200 shadow-sm"
              )}
              rows={1}
            />

            {/* Emoji Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-9 w-9 p-0 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all group"
              title="Add emoji"
            >
              <Smile className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
            </Button>
          </div>

          {/* Emoji Picker */}
          <EmojiPicker
            isOpen={showEmojiPicker}
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "h-11 w-11 p-0 rounded-xl transition-all duration-200",
              canSend
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
            )}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Quick Actions (Mobile) */}
        <div className="md:hidden flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMediaSharing(!showMediaSharing)}
            disabled={disabled}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
          >
            <Image className="h-4 w-4" />
            <span className="text-sm">Media</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
          >
            <Smile className="h-4 w-4" />
            <span className="text-sm">Emoji</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
          >
            <Mic className="h-4 w-4" />
            <span className="text-sm">Voice</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
