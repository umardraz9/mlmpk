'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  Edit3, 
  Check, 
  X, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MessageEditProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newContent: string) => void;
  originalContent: string;
  canEdit: boolean;
  timeLeft?: number; // seconds left to edit
  className?: string;
}

export const MessageEdit: React.FC<MessageEditProps> = memo(({
  isOpen,
  onClose,
  onSave,
  originalContent,
  canEdit,
  timeLeft,
  className
}) => {
  const [content, setContent] = useState(originalContent);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(originalContent);
      
      // Focus and select all text
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 100);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, originalContent]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [content]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!canEdit || content.trim() === originalContent.trim()) {
      onClose();
      return;
    }

    if (content.trim().length === 0) {
      return; // Don't save empty messages
    }

    try {
      setIsSaving(true);
      await onSave(content.trim());
      onClose();
    } catch (error) {
      console.error('Failed to save message:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const hasChanges = content.trim() !== originalContent.trim();
  const isEmpty = content.trim().length === 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700",
          "w-full max-w-lg mx-4 overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Edit3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Edit Message
              </h3>
              {timeLeft !== undefined && timeLeft > 0 && (
                <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  {formatTimeLeft(timeLeft)} left to edit
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Edit Warning */}
          {!canEdit ? (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800 dark:text-red-200">
                This message can no longer be edited. You can only edit messages within 15 minutes of sending.
              </div>
            </div>
          ) : timeLeft !== undefined && timeLeft < 300 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                You have {formatTimeLeft(timeLeft)} left to edit this message.
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Message Content
            </label>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={!canEdit || isSaving}
              className={cn(
                "min-h-20 max-h-48 resize-none",
                "border-gray-300 dark:border-gray-600",
                "focus:border-blue-500 focus:ring-blue-500",
                !canEdit && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              )}
            />
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                {content.length} characters
              </span>
              <span>
                Press Enter to save, Shift+Enter for new line
              </span>
            </div>
          </div>

          {/* Changes Indicator */}
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
              Message has been modified
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Edited messages will show "(edited)" to other participants
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canEdit || !hasChanges || isEmpty || isSaving}
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

MessageEdit.displayName = 'MessageEdit';
