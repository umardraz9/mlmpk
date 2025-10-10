'use client';

import React, { memo, useState, useRef } from 'react';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  X, 
  Download, 
  Eye,
  ExternalLink,
  Upload,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  preview?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  isUploaded?: boolean;
  url?: string;
}

interface MediaSharingProps {
  onFilesSelect: (files: MediaFile[]) => void;
  onFileRemove: (fileId: string) => void;
  selectedFiles: MediaFile[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  isUploading?: boolean;
  className?: string;
}

const FILE_TYPE_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  other: Archive
};

const SUPPORTED_FORMATS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'],
  videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf']
};

export const MediaSharing: React.FC<MediaSharingProps> = memo(({
  onFilesSelect,
  onFileRemove,
  selectedFiles,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  acceptedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  isUploading = false,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): MediaFile['type'] => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('document') || type.includes('text') || 
        type.includes('spreadsheet') || type.includes('presentation')) return 'document';
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const processFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: MediaFile[] = [];

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        console.warn(`File ${file.name} is too large. Max size: ${maxFileSize}MB`);
        continue;
      }

      // Check if we've reached max files
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        console.warn(`Maximum ${maxFiles} files allowed`);
        break;
      }

      const preview = await createFilePreview(file);
      
      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: getFileType(file),
        preview,
        uploadProgress: 0,
        isUploading: false,
        isUploaded: false
      });
    }

    if (validFiles.length > 0) {
      onFilesSelect(validFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Select files to share"
      />

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
          isDragOver 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            isDragOver 
              ? "bg-blue-100 dark:bg-blue-900/30" 
              : "bg-gray-100 dark:bg-gray-800"
          )}>
            <Upload className={cn(
              "h-6 w-6 transition-colors",
              isDragOver 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-gray-600 dark:text-gray-400"
            )} />
          </div>
          
          <div>
            <p className="font-medium text-gray-900 dark:text-white mb-1">
              {isDragOver ? 'Drop files here' : 'Share photos, videos, documents'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag & drop or click to select • Max {maxFileSize}MB per file
            </p>
          </div>

          {/* Supported formats */}
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(SUPPORTED_FORMATS).map(([category, formats]) => (
              <div key={category} className="text-xs text-gray-500 dark:text-gray-400">
                {category}: {formats.slice(0, 3).join(', ')}
                {formats.length > 3 && '...'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Selected Files ({selectedFiles.length}/{maxFiles})
            </h4>
            {selectedFiles.length > 0 && !isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedFiles.forEach(file => onFileRemove(file.id))}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedFiles.map((mediaFile) => {
              const IconComponent = FILE_TYPE_ICONS[mediaFile.type];
              
              return (
                <div
                  key={mediaFile.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {mediaFile.preview ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        <img
                          src={mediaFile.preview}
                          alt={mediaFile.file.name}
                          className="w-full h-full object-cover"
                        />
                        {mediaFile.type === 'video' && (
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <Video className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {mediaFile.file.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(mediaFile.file.size)} • {mediaFile.type}
                    </p>
                    
                    {/* Upload Progress */}
                    {mediaFile.isUploading && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          <span className="text-xs text-blue-600">
                            Uploading... {mediaFile.uploadProgress}%
                          </span>
                        </div>
                        <Progress 
                          value={mediaFile.uploadProgress} 
                          className="h-1"
                        />
                      </div>
                    )}

                    {mediaFile.isUploaded && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Uploaded
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {mediaFile.preview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(mediaFile.preview, '_blank')}
                        className="h-8 w-8 p-0"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {!mediaFile.isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFileRemove(mediaFile.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'image/*';
              fileInputRef.current.click();
            }
          }}
          disabled={isUploading || selectedFiles.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <Image className="h-4 w-4" />
          Photos
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'video/*';
              fileInputRef.current.click();
            }
          }}
          disabled={isUploading || selectedFiles.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <Video className="h-4 w-4" />
          Videos
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
              fileInputRef.current.click();
            }
          }}
          disabled={isUploading || selectedFiles.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Documents
        </Button>
      </div>
    </div>
  );
});

MediaSharing.displayName = 'MediaSharing';
