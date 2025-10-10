'use client';

import React, { memo, useState, useRef, useCallback } from 'react';
import { Send, Camera, Video, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CreatePostProps {
  onCreatePost: (content: string, type: string, mediaFiles?: File[]) => Promise<void>;
  userName?: string;
  userAvatar?: string;
  isLoading?: boolean;
}

export const CreatePost: React.FC<CreatePostProps> = memo(({
  onCreatePost,
  userName = 'You',
  userAvatar = '/api/placeholder/50/50',
  isLoading = false
}) => {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'general' | 'achievement' | 'tip' | 'success' | 'announcement' | 'reel'>('general');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;

    const maxFiles = 10;
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB

    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        alert(`Unsupported file type: ${file.name}. Please select images or videos.`);
        return;
      }

      if (isImage && file.size > maxImageSize) {
        alert(`Image too large: ${file.name}. Maximum size is 10MB.`);
        return;
      }

      if (isVideo && file.size > maxVideoSize) {
        alert(`Video too large: ${file.name}. Maximum size is 100MB.`);
        return;
      }

      if (validFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    });

    setMediaFiles(prev => [...prev, ...validFiles]);
    setMediaPreviews(prev => [...prev, ...previews]);
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    console.log(`Selected ${files.length} files:`, files.map(f => f.name));

    // Clear existing files when new selection is made
    setMediaFiles([]);
    setMediaPreviews([]);

    processFiles(files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    console.log(`Dropped ${files.length} files:`, files.map(f => f.name));

    // Clear existing files when new files are dropped
    setMediaFiles([]);
    setMediaPreviews([]);

    // Process files directly instead of simulating input event
    processFiles(files);
  }, [processFiles]);

  const removeMedia = useCallback((index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Clean up object URLs
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || isLoading || isUploading) return;

    console.log(`Submitting post with ${mediaFiles.length} files:`, mediaFiles.map(f => f.name));

    try {
      setIsUploading(true);
      setUploadProgress(10);

      await onCreatePost(content.trim(), postType, mediaFiles);

      // Reset form
      setContent('');
      setPostType('general');
      setMediaFiles([]);
      setMediaPreviews([]);
      setUploadProgress(0);

      // Clean up object URLs
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const postTypeOptions = [
    { value: 'general', label: 'General', icon: '💬' },
    { value: 'achievement', label: 'Achievement', icon: '🏆' },
    { value: 'tip', label: 'Tip', icon: '💡' },
    { value: 'success', label: 'Success', icon: '✅' },
    { value: 'announcement', label: 'Announcement', icon: '📢' },
    { value: 'reel', label: 'Reel', icon: '📹' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4"
         onDragOver={handleDragOver}
         onDragEnter={handleDragEnter}
         onDrop={handleDrop}>
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            placeholder="Share your success, tips, or thoughts with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[80px] resize-none border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-100 placeholder-gray-500"
            disabled={isLoading || isUploading}
          />

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="mt-4">
              <div className={`grid gap-2 rounded-lg overflow-hidden bg-gray-50 p-2 ${
                mediaPreviews.length === 1 ? 'grid-cols-1' :
                mediaPreviews.length === 2 ? 'grid-cols-2' :
                mediaPreviews.length === 3 ? 'grid-cols-2' :
                'grid-cols-2'
              }`}>
                {mediaPreviews.map((preview, index) => {
                  const isVideo = mediaFiles[index]?.type.startsWith('video/');
                  const isLast = index === 3 && mediaPreviews.length > 4;

                  // Special layout for 3 files: first takes more space
                  const getGridClasses = () => {
                    if (mediaPreviews.length === 3) {
                      return index === 0 ? 'col-span-2' : 'col-span-1';
                    }
                    return '';
                  };

                  return (
                    <div key={index} className={`relative group ${getGridClasses()}`}>
                      {isVideo ? (
                        <div className="relative">
                          <video
                            src={preview}
                            className={`w-full object-cover rounded-lg ${
                              mediaPreviews.length === 3 && index === 0 ? 'h-32' : 'h-24'
                            }`}
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                            <div className="bg-white bg-opacity-90 rounded-full p-2">
                              <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className={`w-full object-cover rounded-lg ${
                            mediaPreviews.length === 3 && index === 0 ? 'h-32' : 'h-24'
                          }`}
                        />
                      )}

                      {/* Remove button */}
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        disabled={isLoading || isUploading}
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {/* Additional files overlay */}
                      {isLast && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                          <div className="text-center">
                            <span className="text-white font-bold text-lg block">
                              +{mediaPreviews.length - 4}
                            </span>
                            <span className="text-white text-xs">more</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* File counter */}
              <div className="mt-2 text-sm text-gray-600 text-center">
                {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading... {uploadProgress}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading || isUploading}
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
              >
                <Camera className="h-4 w-4 mr-2" />
                Photo
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
              >
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>

              <Select value={postType} onValueChange={(value: 'general' | 'achievement' | 'tip' | 'success' | 'announcement' | 'reel') => setPostType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {postTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isLoading || isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

CreatePost.displayName = 'CreatePost';
