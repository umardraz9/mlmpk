'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Star, Heart, ShoppingCart, Zap } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  trending?: boolean;
  discount?: number;
  categoryId?: string;
  hasRealImages?: boolean;
  tags?: string[];
  slug?: string;
}

interface OptimizedProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onClick: (product: Product) => void;
  fallbackImage: string;
}

const OptimizedProductCard = memo(function OptimizedProductCard({
  product,
  viewMode,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onBuyNow,
  onClick,
  fallbackImage
}: OptimizedProductCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(product);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(product);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuyNow(product);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        <div className={cn(
          "relative w-full",
          viewMode === 'grid' ? "h-48" : "h-32 md:h-48"
        )}>
          <Image
            src={product.images[0] || fallbackImage}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX1HaH9bcfaSXWGaRmknyLmhZVQeHQBWX/2Q=="
          />
        </div>
        {!product.hasRealImages && (
          <div className="absolute bottom-2 left-2 bg-gray-800/80 text-white px-2 py-1 rounded text-xs">
            Reference image
          </div>
        )}
        {product.trending && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            Trending
          </div>
        )}
        {product.discount && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
            -{product.discount}%
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 p-2 bg-white/80 hover:bg-white"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
        </Button>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
        
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">({product.reviews})</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-green-600">Rs.{product.price}</p>
            {product.originalPrice && (
              <p className="text-sm text-gray-500 line-through">Rs.{product.originalPrice}</p>
            )}
          </div>
          <span className={cn(
            "px-2 py-1 rounded text-sm font-medium",
            product.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          )}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            disabled={!product.inStock}
            onClick={handleAddToCartClick}
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={!product.inStock}
            onClick={handleBuyNowClick}
            aria-label="Buy now"
          >
            <Zap className="h-4 w-4 mr-2" /> Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
});

export default OptimizedProductCard;
