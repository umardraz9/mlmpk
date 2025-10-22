'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Send,
  X,
  ArrowLeft,
  ArrowRight,
  Image,
  Video,
  Smile,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Zap,
  CheckCircle,
  Globe,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';

interface CreatePostProps {
  onPostCreated?: (post: any) => void;
  onCancel?: () => void;
  initialType?: string;
  initialContent?: string;
}

export default function ModernCreatePost({
  onPostCreated,
  onCancel,
  initialType = 'general',
  initialContent = ''
}: CreatePostProps) {
  const { data: session } = useSession();
  const [showCreatePost, setShowCreatePost] = useState(true);
  const [newPostContent, setNewPostContent] = useState(initialContent);
  const [newPostType, setNewPostType] = useState(initialType);
  const [createLoading, setCreateLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const postTypes = [
    { value: 'general', label: 'General Post', icon: MessageCircle, color: 'text-gray-600', bg: 'bg-gray-100' },
    { value: 'achievement', label: 'Achievement', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'tip', label: 'Tip & Advice', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'success', label: 'Success Story', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'announcement', label: 'Announcement', icon: Globe, color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'reel', label: 'Reel (Vertical Video)', icon: Video, color: 'text-pink-600', bg: 'bg-pink-100' }
  ];

  const selectedType = postTypes.find(type => type.value === newPostType);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        alert('Please select only images or videos.');
        return false;
      }

      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image
      if (file.size > maxSize) {
        alert(`${file.name} is too large. ${isVideo ? 'Videos must be under 100MB.' : 'Images must be under 10MB.'}`);
        return false;
      }

      return true;
    });

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));

    setMediaFiles(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 files
    setMediaPreviews(prev => [...prev, ...newPreviews].slice(0, 10));
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const moveMedia = (from: number, to: number) => {
    const newFiles = [...mediaFiles];
    const newPreviews = [...mediaPreviews];

    [newFiles[from], newFiles[to]] = [newFiles[to], newFiles[from]];
    [newPreviews[from], newPreviews[to]] = [newPreviews[to], newPreviews[from]];

    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && mediaFiles.length === 0) return;

    setCreateLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Here you would make the actual API call
      const newPost = {
        id: Date.now().toString(),
        content: newPostContent,
        type: newPostType,
        author: {
          name: session?.user?.name || 'User',
          avatar: session?.user?.image || '',
          verified: true,
          level: 1
        },
        createdAt: new Date(),
        likes: 0,
        comments: 0,
        shares: 0,
        mediaUrls: mediaPreviews
      };

      onPostCreated?.(newPost);

      // Reset form
      setNewPostContent('');
      setNewPostType('general');
      setMediaFiles([]);
      setMediaPreviews([]);
      setShowCreatePost(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={session?.user?.image || ''} />
            <AvatarFallback className="bg-gradient-to-br from-social-gradient-from to-social-gradient-to text-white">
              {session?.user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900">
              {session?.user?.name || 'User'}
            </p>
            <Badge variant="secondary" className="text-xs">
              Level {session?.user?.level || 1}
            </Badge>
          </div>
        </div>

        {/* Post Type Selector */}
        <div className="mb-4">
          <Select value={newPostType} onValueChange={setNewPostType}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                {selectedType && (
                  <>
                    <selectedType.icon className={`h-4 w-4 ${selectedType.color}`} />
                    <SelectValue />
                  </>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              {postTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${type.color}`} />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Post Content */}
        <Textarea
          placeholder={`What's on your mind? Share your ${selectedType?.label.toLowerCase()}...`}
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          rows={4}
          className="resize-none border-0 focus:ring-0 text-lg placeholder-gray-400 bg-gray-50 focus:bg-white transition-colors"
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {newPostContent.length}/500 characters
          </span>
          {newPostContent.length > 450 && (
            <Badge variant="outline" className="text-xs text-orange-600">
              Almost at limit
            </Badge>
          )}
        </div>

        {/* Media Upload Area */}
        {mediaPreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mediaPreviews.map((preview, index) => (
              <div
                key={index}
                className={`relative group border-2 border-dashed border-gray-200 rounded-xl overflow-hidden ${
                  hoverIndex === index ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoverIndex(index);
                }}
                onDragLeave={() => setHoverIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) {
                    moveMedia(dragIndex, index);
                  }
                  setDragIndex(null);
                  setHoverIndex(null);
                }}
              >
                {mediaFiles[index]?.type.startsWith('image/') ? (
                  <img
                    src={preview}
                    alt={`Media ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <video
                    src={preview}
                    className="w-full h-24 object-cover"
                  />
                )}

                {/* Media type indicator */}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-black/60 text-white border-0"
                  >
                    {mediaFiles[index]?.type.startsWith('image/') ? 'IMG' : 'VID'}
                  </Badge>
                </div>

                {/* Hover controls */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => moveMedia(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => moveMedia(index, Math.min(mediaPreviews.length - 1, index + 1))}
                      disabled={index === mediaPreviews.length - 1}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploadingMedia && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Uploading media...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingMedia}
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              <Image className="h-4 w-4 mr-2" />
              Photos
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingMedia}
              className="hover:bg-purple-50 hover:border-purple-300"
            >
              <Video className="h-4 w-4 mr-2" />
              Videos
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="hover:bg-green-50 hover:border-green-300"
            >
              <Smile className="h-4 w-4 mr-2" />
              Emoji
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel || (() => setShowCreatePost(false))}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={
                createLoading ||
                uploadingMedia ||
                (!newPostContent.trim() && mediaFiles.length === 0)
              }
              className="bg-gradient-to-r from-social-gradient-from to-social-gradient-to hover:from-social-gradient-to hover:to-social-gradient-from text-white shadow-md hover:shadow-lg"
            >
              {createLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
