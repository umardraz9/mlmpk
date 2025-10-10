'use client';

import React, { memo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  images: string[];
}

interface ImageModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  selectedImageIndex: number;
  onImageIndexChange: (index: number) => void;
}

export const ImageModal: React.FC<ImageModalProps> = memo(({
  product,
  isOpen,
  onClose,
  selectedImageIndex,
  onImageIndexChange
}) => {
  if (!isOpen || !product) return null;

  const fallbackImage = 'https://placehold.co/600x600?text=No+Image';

  const handlePreviousImage = () => {
    onImageIndexChange(Math.max(0, selectedImageIndex - 1));
  };

  const handleNextImage = () => {
    onImageIndexChange(Math.min(product.images.length - 1, selectedImageIndex + 1));
  };

  const handleThumbnailClick = (index: number) => {
    onImageIndexChange(index);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 id="modal-title" className="text-lg font-semibold">
            {product.name}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close image viewer"
            title="Close"
            className="hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative h-96">
          <Image
            src={product.images[selectedImageIndex] || fallbackImage}
            alt={product.name}
            fill
            sizes="(max-width: 1280px) 100vw, 50vw"
            className="object-contain"
            priority
          />

          {/* Navigation Arrows */}
          {product.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm"
                onClick={handlePreviousImage}
                disabled={selectedImageIndex === 0}
                aria-label="Previous image"
                title="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-sm"
                onClick={handleNextImage}
                disabled={selectedImageIndex === product.images.length - 1}
                aria-label="Next image"
                title="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {product.images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto bg-gray-50">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  "flex-shrink-0 w-16 h-16 border-2 rounded overflow-hidden transition-all",
                  selectedImageIndex === index
                    ? "border-green-500 ring-2 ring-green-200"
                    : "border-gray-200 hover:border-gray-300"
                )}
                aria-label={`Select image ${index + 1}`}
                title={`Select image ${index + 1}`}
              >
                <Image
                  src={image || fallbackImage}
                  alt={`${product.name} ${index + 1}`}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ImageModal.displayName = 'ImageModal';
