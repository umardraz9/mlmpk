'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

// Fallback image for errors
const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgVW5hdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';

// Blur placeholder generator
const generateBlurPlaceholder = (color: string = '#f3f4f6'): string => {
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="8" height="8" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="8" fill="${color}"/></svg>`
  ).toString('base64')}`;
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  className,
  fill = false,
  sizes,
  placeholder = 'blur',
  blurDataURL = generateBlurPlaceholder(),
  loading = 'lazy',
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageSrc(FALLBACK_IMAGE);
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || fill 
    ? sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : undefined;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        {...(fill ? { fill: true } : { width: width || 400, height: height || 400 })}
        priority={priority}
        quality={quality}
        sizes={responsiveSizes}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          fill && 'object-cover'
        )}
      />
    </div>
  );
};

// WebP format detector and converter
export const useWebPSupport = () => {
  const [isSupported, setIsSupported] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const webP = new window.Image();
    webP.onload = webP.onerror = () => {
      setIsSupported(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }, []);

  return isSupported;
};

// Progressive image loading component
export const ProgressiveImage: React.FC<{
  src: string;
  alt: string;
  thumbnail?: string;
  className?: string;
}> = ({ src, alt, thumbnail, className }) => {
  const [currentSrc, setCurrentSrc] = useState(thumbnail || src);
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    if (!thumbnail) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [src, thumbnail]);

  return (
    <div className={cn('relative', className)}>
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-all duration-700',
          !isLoaded && thumbnail && 'filter blur-lg scale-105'
        )}
      />
    </div>
  );
};

// Lazy load images with Intersection Observer
export const LazyImage: React.FC<OptimizedImageProps> = (props) => {
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef}>
      {isInView ? (
        <OptimizedImage {...props} />
      ) : (
        <div className={cn('bg-gray-200 dark:bg-gray-800 animate-pulse', props.className)} 
             style={{ width: props.width, height: props.height }} />
      )}
    </div>
  );
};
