'use client';

import React, { useState, useRef } from 'react';
import { useSession } from '@/hooks/useSession';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Image,
  Video,
  Smile,
  MapPin,
  Tag,
  X,
  Upload
} from 'lucide-react';

interface FacebookCreatePostProps {
  onPostCreated?: (post: any) => void;
}

export default function FacebookCreatePost({ onPostCreated }: FacebookCreatePostProps) {
  const { data: session } = useSession();
  const [postContent, setPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState<'general' | 'achievement' | 'tip' | 'success' | 'announcement' | 'reel'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const postTypes = [
    { value: 'general', label: 'General', icon: '💬', color: 'bg-gray-100 text-gray-800' },
    { value: 'achievement', label: 'Achievement', icon: '🏆', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'tip', label: 'Tip', icon: '💡', color: 'bg-blue-100 text-blue-800' },
    { value: 'success', label: 'Success Story', icon: '✅', color: 'bg-green-100 text-green-800' },
    { value: 'announcement', label: 'Announcement', icon: '📢', color: 'bg-purple-100 text-purple-800' },
    { value: 'reel', label: 'Reel', icon: '🎥', color: 'bg-pink-100 text-pink-800' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newMedia = [...selectedMedia, ...files];
    const newPreviews = [...mediaPreviews];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          setMediaPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedMedia(newMedia);
    setIsExpanded(true);
  };

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setSelectedMedia(newMedia);
    setMediaPreviews(newPreviews);
  };

  const handlePost = async () => {
    if (!postContent.trim() && selectedMedia.length === 0) return;

    try {
      // This would typically call an API to create the post
      const postData = {
        content: postContent,
        type: postType,
        mediaUrls: selectedMedia.map(file => URL.createObjectURL(file)),
        author: {
          id: session?.user?.id,
          name: session?.user?.name,
          avatar: session?.user?.image
        },
        createdAt: new Date()
      };

      onPostCreated?.(postData);

      // Reset form
      setPostContent('');
      setSelectedMedia([]);
      setMediaPreviews([]);
      setIsExpanded(false);
      setPostType('general');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <Card className="bg-white border border-gray-300 rounded-lg shadow-sm">
      <CardContent className="p-4">
        {/* Create Post Input */}
        <div className="flex space-x-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={session?.user?.image || ''} />
            <AvatarFallback className="bg-blue-600 text-white">
              {session?.user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <textarea
              placeholder="What's on your mind?"
              value={postContent}
              onChange={(e) => {
                setPostContent(e.target.value);
                if (e.target.value.length > 0) setIsExpanded(true);
              }}
              className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={isExpanded ? 3 : 1}
              onFocus={() => setIsExpanded(true)}
            />
          </div>
        </div>

        {/* Post Type Selector */}
        {isExpanded && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {postTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={postType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType(type.value as any)}
                  className={`text-xs ${postType === type.value ? 'bg-blue-600 text-white' : ''}`}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Media Preview */}
        {mediaPreviews.length > 0 && (
          <div className="mb-4">
            <div className={`grid gap-2 rounded-lg overflow-hidden ${
              mediaPreviews.length === 1 ? 'grid-cols-1' :
              mediaPreviews.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  {selectedMedia[index]?.type.startsWith('video/') ? (
                    <video
                      src={preview}
                      controls
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-600 hover:bg-gray-100"
            >
              <Image className="h-5 w-5 mr-2 text-green-500" />
              Photo
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-600 hover:bg-gray-100"
            >
              <Video className="h-5 w-5 mr-2 text-red-500" />
              Video
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-gray-100"
            >
              <Smile className="h-5 w-5 mr-2 text-yellow-500" />
              Feeling
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-gray-100"
            >
              <Tag className="h-5 w-5 mr-2 text-blue-500" />
              Tag
            </Button>
          </div>

          <Button
            onClick={handlePost}
            disabled={!postContent.trim() && selectedMedia.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Post
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
