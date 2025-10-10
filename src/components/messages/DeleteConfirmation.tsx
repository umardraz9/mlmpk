'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  Clock,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteType: 'delete-for-me' | 'delete-for-everyone') => void;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'file';
  isOwn: boolean;
  canDeleteForEveryone: boolean;
  className?: string;
}

const MESSAGE_TYPE_ICONS = {
  text: MessageSquare,
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
  file: Archive
};

const MESSAGE_TYPE_LABELS = {
  text: 'message',
  image: 'photo',
  video: 'video',
  audio: 'voice message',
  document: 'document',
  file: 'file'
};

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = memo(({
  isOpen,
  onClose,
  onConfirm,
  messageType,
  isOwn,
  canDeleteForEveryone,
  className
}) => {
  const [selectedOption, setSelectedOption] = useState<'delete-for-me' | 'delete-for-everyone'>('delete-for-me');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the modal for accessibility
      modalRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const IconComponent = MESSAGE_TYPE_ICONS[messageType];
  const messageLabel = MESSAGE_TYPE_LABELS[messageType];

  const handleConfirm = () => {
    onConfirm(selectedOption);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700",
          "w-full max-w-md mx-4 overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Delete {messageLabel}?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone
              </p>
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
          {/* Message Type Indicator */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <IconComponent className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {messageLabel}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {messageType === 'text' ? 'Text message' : `${messageType.charAt(0).toUpperCase() + messageType.slice(1)} file`}
              </p>
            </div>
          </div>

          {/* Delete Options */}
          <div className="space-y-3">
            {/* Delete for Me */}
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="radio"
                name="deleteOption"
                value="delete-for-me"
                checked={selectedOption === 'delete-for-me'}
                onChange={(e) => setSelectedOption(e.target.value as 'delete-for-me')}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Delete for me
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  This {messageLabel} will be deleted from this device only. Other participants will still see it.
                </div>
              </div>
            </label>

            {/* Delete for Everyone (only if conditions are met) */}
            {isOwn && canDeleteForEveryone && (
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="deleteOption"
                  value="delete-for-everyone"
                  checked={selectedOption === 'delete-for-everyone'}
                  onChange={(e) => setSelectedOption(e.target.value as 'delete-for-everyone')}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Delete for everyone
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    This {messageLabel} will be deleted for all participants in this chat.
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="h-3 w-3" />
                    Available for 1 hour after sending
                  </div>
                </div>
              </label>
            )}

            {/* Warning for non-own messages */}
            {!isOwn && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  You can only delete this {messageLabel} for yourself. The sender and other participants will still see it.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="px-6 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
});

DeleteConfirmation.displayName = 'DeleteConfirmation';
