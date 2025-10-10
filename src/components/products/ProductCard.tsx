'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  trending?: boolean;
  discount?: number;
  hasRealImages?: boolean;
  slug?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
  isFavorite: boolean;
  viewMode: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  onAddToCart,
  onBuyNow,
  onToggleFavorite,
  isFavorite,
  viewMode
}) => {
  const router = useRouter();
  const fallbackImage = 'https://placehold.co/600x600?text=No+Image';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/products/${product.slug || product.id}`);
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer group",
        viewMode === 'list' && "flex"
      )}
      onClick={handleCardClick}
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      <div className={cn(
        "relative",
        viewMode === 'grid' ? "w-full h-48" : "w-32 md:w-48 h-32 md:h-48 flex-shrink-0"
      )}>
        <Image
          src={product.images[0] || fallbackImage}
          alt={product.name}
          fill
          sizes={viewMode === 'grid' ? "(max-width: 1024px) 100vw, 33vw" : "(max-width: 768px) 100vw, 50vw"}
          className="object-cover"
          priority={true}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!product.hasRealImages && (
            <div className="bg-gray-800/80 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
              Reference image
            </div>
          )}
          {product.trending && (
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Trending
            </div>
          )}
        </div>

        {product.discount && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
            -{product.discount}%
          </div>
        )}

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 p-2 bg-white/80 hover:bg-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
        </Button>
      </div>

      <div className={cn("p-4", viewMode === 'list' && "flex-1")}>
        <h3 className={cn(
          "font-semibold mb-2 line-clamp-2",
          viewMode === 'grid' ? "text-lg" : "text-base"
        )}>
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(product.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-green-600">
              Rs.{product.price.toLocaleString()}
            </p>
            {product.originalPrice && (
              <p className="text-sm text-gray-500 line-through">
                Rs.{product.originalPrice.toLocaleString()}
              </p>
            )}
          </div>
          <span className={cn(
            "px-2 py-1 rounded text-sm font-medium",
            product.inStock
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
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
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            aria-label="Add to cart"
            title="Add to cart"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={!product.inStock}
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(product);
            }}
            aria-label="Buy now"
            title="Buy now"
          >
            <Zap className="h-4 w-4 mr-2" />
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
