"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Upload, User } from 'lucide-react';

interface UserAvatarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUpload?: boolean;
  onImageUpdate?: (imageUrl: string) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-xl'
};

export default function UserAvatar({
  user,
  size = 'md',
  showUpload = false,
  onImageUpdate,
  className = ''
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpdate) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      onImageUpdate(data.imageUrl);
      setImageError(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (showUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayName = user?.name || 'User';
  const initials = getInitials(displayName);
  const hasImage = user?.image && !imageError;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          overflow-hidden
          border-2 border-gray-200
          bg-gradient-to-br from-emerald-400 to-teal-500
          flex items-center justify-center
          text-white font-semibold
          cursor-pointer
          transition-all duration-200
          ${showUpload ? 'hover:scale-105 hover:shadow-lg' : ''}
          ${isHovered && showUpload ? 'ring-2 ring-emerald-300' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {hasImage ? (
          <Image
            src={user.image}
            alt={`${displayName}'s avatar`}
            width={100}
            height={100}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="select-none">
            {initials || <User className="w-1/2 h-1/2" />}
          </span>
        )}

        {/* Upload overlay */}
        {showUpload && (
          <div
            className={`
              absolute inset-0
              bg-black bg-opacity-50
              rounded-full
              flex items-center justify-center
              transition-opacity duration-200
              ${isHovered || isUploading ? 'opacity-100' : 'opacity-0'}
            `}
          >
            {isUploading ? (
              <div className="animate-spin">
                <Upload className="w-1/2 h-1/2 text-white" />
              </div>
            ) : (
              <Camera className="w-1/2 h-1/2 text-white" />
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      {showUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}
    </div>
  );
}
