'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Heart, ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { OptimizedImage } from '@/components/OptimizedImage';
import { cn } from '@/lib/utils';

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
  discount?: number;
}

interface OptimizedProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onFavoriteToggle?: (productId: string) => void;
  isFavorite?: boolean;
}

// Memoized rating stars component
const RatingStars = memo(({ rating, reviews }: { rating: number; reviews: number }) => {
  const stars = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={cn(
          'text-sm',
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        )}
      >
        ★
      </span>
    ));
  }, [rating]);

  return (
    <div className="flex items-center space-x-1">
      <div className="flex">{stars}</div>
      <span className="text-xs text-gray-500">({reviews})</span>
    </div>
  );
});
RatingStars.displayName = 'RatingStars';

// Memoized price display component
const PriceDisplay = memo(({ 
  price, 
  originalPrice, 
  discount 
}: { 
  price: number; 
  originalPrice?: number; 
  discount?: number;
}) => {
  const formattedPrice = useMemo(() => 
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price),
    [price]
  );

  const formattedOriginalPrice = useMemo(() => 
    originalPrice ? new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(originalPrice) : null,
    [originalPrice]
  );

  return (
    <div className="flex items-center space-x-2">
      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
        {formattedPrice}
      </span>
      {originalPrice && (
        <>
          <span className="text-sm text-gray-500 line-through">
            {formattedOriginalPrice}
          </span>
          {discount && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
              {discount}% OFF
            </span>
          )}
        </>
      )}
    </div>
  );
});
PriceDisplay.displayName = 'PriceDisplay';

// Main optimized product card component
export const OptimizedProductCard = memo<OptimizedProductCardProps>(({ 
  product, 
  viewMode = 'grid',
  onFavoriteToggle,
  isFavorite = false
}) => {
  const { addToCart } = useCart();

  // Memoized callbacks
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      quantity: 1,
    });
  }, [addToCart, product]);

  const handleBuyNow = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddToCart(e);
    // Navigate to checkout
    window.location.href = '/checkout';
  }, [handleAddToCart]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(product.id);
  }, [onFavoriteToggle, product.id]);

  // Render different layouts based on view mode
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex space-x-4">
        <div className="w-32 h-32 flex-shrink-0">
          <OptimizedImage
            src={product.images[0] || ''}
            alt={product.name}
            width={128}
            height={128}
            className="rounded-lg object-cover w-full h-full"
            priority={false}
          />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {product.description}
              </p>
              <RatingStars rating={product.rating} reviews={product.reviews} />
            </div>
            
            <button
              onClick={handleFavoriteClick}
              className={cn(
                'p-2 rounded-full transition-colors',
                isFavorite 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-gray-100 text-gray-400 hover:text-red-500'
              )}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <PriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
              discount={product.discount}
            />
            
            <div className="flex space-x-2">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                aria-label="Add to cart"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-sm">Add</span>
              </button>
              
              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                aria-label="Buy now"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">Buy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative aspect-square">
        <OptimizedImage
          src={product.images[0] || ''}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={false}
        />
        
        {product.discount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
            {product.discount}% OFF
          </div>
        )}
        
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}
        
        <button
          onClick={handleFavoriteClick}
          className={cn(
            'absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm transition-all',
            isFavorite 
              ? 'text-red-600' 
              : 'text-gray-400 hover:text-red-500'
          )}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
        </button>
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">
            {product.category}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <RatingStars rating={product.rating} reviews={product.reviews} />
        
        <div className="mt-4 space-y-3">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            discount={product.discount}
          />
          
          <div className="flex space-x-2">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">Add to Cart</span>
            </button>
            
            <button
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Buy now"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedProductCard.displayName = 'OptimizedProductCard';

// Virtual list component for large product lists
export const VirtualProductList = memo<{
  products: Product[];
  viewMode: 'grid' | 'list';
  onFavoriteToggle?: (productId: string) => void;
  favorites?: Set<string>;
}>(({ products, viewMode, onFavoriteToggle, favorites = new Set() }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 10 });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = viewMode === 'grid' ? 400 : 150;
      const containerHeight = container.clientHeight;
      
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.ceil((scrollTop + containerHeight) / itemHeight);
      
      setVisibleRange({ 
        start: Math.max(0, start - 2), 
        end: Math.min(products.length, end + 2) 
      });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [products.length, viewMode]);

  const visibleProducts = products.slice(visibleRange.start, visibleRange.end);

  return (
    <div 
      ref={containerRef}
      className="overflow-y-auto h-full"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      <div 
        style={{ 
          height: products.length * (viewMode === 'grid' ? 400 : 150),
          position: 'relative' 
        }}
      >
        <div 
          style={{ 
            transform: `translateY(${visibleRange.start * (viewMode === 'grid' ? 400 : 150)}px)` 
          }}
        >
          {visibleProducts.map((product) => (
            <OptimizedProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              onFavoriteToggle={onFavoriteToggle}
              isFavorite={favorites.has(product.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualProductList.displayName = 'VirtualProductList';
