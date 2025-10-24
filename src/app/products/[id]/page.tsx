'use client';

import ProductHeader from '@/components/ProductHeader';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Star,
  Heart,
  ShoppingCart,
  Share2,
  Package,
  Minus,
  Plus,
  Check,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  rating: number;
  stock: number;
  specifications?: Record<string, string>;
  features?: string[];
  comparePrice?: number;
  discount?: number;
  hasRealImages?: boolean;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<Notification | null>(null);
  const fallbackImage = 'https://placehold.co/600x600?text=No+Image';

  // Fix hydration by ensuring client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        // Transform and sanitize images to ensure next/image gets valid URLs
        const rawImages = Array.isArray(data.product.images)
          ? data.product.images
          : (data.product.images ? [data.product.images] : []);
        const isValidUrl = (u: unknown) => typeof u === 'string'
          && u.trim().length > 0
          && (u.startsWith('/') || u.startsWith('http://') || u.startsWith('https://'))
          && u !== '[]'
          && u !== '"[]"';
        const cleanedImages = rawImages.filter(isValidUrl as (u: unknown) => u is string);
        const hasRealImages = cleanedImages.length > 0;

        const transformedProduct = {
          ...data.product,
          images: hasRealImages ? cleanedImages : [fallbackImage],
          hasRealImages,
          rating: data.product.rating || 4.5,
          stock: data.product.stockCount || data.product.quantity || 0,
          specifications: data.product.specifications || {},
          features: data.product.features || []
        };
        setProduct(transformedProduct);
      } catch {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const data = await response.json();
          const favs = Array.isArray(data.favorites)
            ? data.favorites.map((f: { productId: string }) => f.productId)
            : [] as string[];
          setFavorites(new Set(favs));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    };

    loadFavorites();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = async () => {
    if (!product) return;

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity
        })
      });

      if (response.ok) {
        showNotification('success', `Added ${quantity} ${product.name} to cart`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to add to cart');
    }
  };

  const buyNow = async () => {
    if (!product) return;

    try {
      // Add to cart first
      await addToCart();
      // Then redirect to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Buy now error:', error);
      showNotification('error', 'Failed to proceed to checkout');
    }
  };

  // Rich text renderer for HTML descriptions
  const renderDescription = (description: string) => {
    // Simple HTML to JSX converter for basic formatting
    if (!description) return null;
    
    // Check if description contains HTML tags
    const hasHtml = /<[^>]*>/g.test(description);
    
    if (!hasHtml) {
      return <p className="text-gray-600 leading-relaxed">{description}</p>;
    }

    // Basic HTML parsing and rendering
    const createMarkup = (htmlString: string) => {
      // Clean up the HTML and make it safe
      const cleanHtml = htmlString
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
      
      return { __html: cleanHtml };
    };

    return (
      <div 
        className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={createMarkup(description)}
      />
    );
  };

  const toggleFavorite = async () => {
    if (!product) return;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PRODUCT',
          targetId: product.id,
          action: favorites.has(product.id) ? 'remove' : 'add'
        })
      });

      if (response.ok) {
        const result = await response.json();
        const newFavorites = new Set(favorites);
        if (result.favorited) {
          newFavorites.add(product.id);
          showNotification('success', 'Added to favorites');
        } else {
          newFavorites.delete(product.id);
          showNotification('info', 'Removed from favorites');
        }
        setFavorites(newFavorites);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update favorites');
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to update favorites');
    }
  };

  const shareProduct = async () => {
    if (!product) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        showNotification('success', 'Product link copied to clipboard');
      } catch {
        showNotification('error', 'Failed to share product');
      }
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The product you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/products')}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductHeader
        showSearch={false}
        showCategories={false}
        title={product.name}
        subtitle={product.category}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        {/* Notification */}
        {notification && (
          <div className={cn(
            'flex items-center justify-between p-4 rounded-lg mb-6',
            notification.type === 'success' ? 'bg-green-50 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          )} role="alert">
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <Check className="h-5 w-5 text-green-500 flex-shrink-0" />}
              {notification.type === 'error' && <X className="h-5 w-5 text-red-500 flex-shrink-0" />}
              {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss notification"
              title="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm border relative">
              {product.images && product.images.length > 0 ? (
                <>
                  <Image
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                  {!product.hasRealImages && (
                    <span className="absolute top-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded">Reference image</span>
                  )}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === 0 ? product.images.length - 1 : prev - 1
                        )}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md"
                        aria-label="Previous image"
                        title="Previous image"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === product.images.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md"
                        aria-label="Next image"
                        title="Next image"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'aspect-square bg-white rounded-lg overflow-hidden border-2 transition-colors',
                      selectedImageIndex === index ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'
                    )}
                    aria-label={`Select image ${index + 1}`}
                    title={`Select image ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div>
              <p className="text-sm text-gray-500 mb-2">{product.category}</p>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-5 w-5',
                      i < Math.floor(product.rating || 0)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-gray-600">({product.rating || 0})</span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-3">
              <div className="text-4xl font-bold text-green-600">
                PKR {product.price?.toLocaleString() || 0}
              </div>
              {product.comparePrice && (
                <div className="text-2xl text-gray-500 line-through">
                  PKR {product.comparePrice.toLocaleString()}
                </div>
              )}
              {product.discount && (
                <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 bg-white"
                    aria-label="Decrease quantity"
                    title="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-medium w-12 text-center bg-white px-3 py-2 border border-gray-300 rounded-md">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 bg-white"
                    aria-label="Increase quantity"
                    title="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={addToCart}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium flex items-center justify-center transition-colors"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </button>
                <button
                  onClick={buyNow}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium flex items-center justify-center transition-colors"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Buy Now
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={toggleFavorite}
                  className={cn(
                    'p-3 rounded-lg border transition-colors',
                    favorites.has(product.id)
                      ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100'
                      : 'text-gray-400 border-gray-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 bg-white'
                  )}
                  aria-label={favorites.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                  title={favorites.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={cn(
                    'h-5 w-5',
                    favorites.has(product.id) ? 'fill-current' : ''
                  )} />
                </button>
                <button
                  onClick={shareProduct}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 bg-white"
                  aria-label="Share product"
                  title="Share product"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              {renderDescription(product.description)}
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Features</h3>
                <ul className="space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  product.stock > 0 ? 'bg-green-500' : 'bg-red-500'
                )}></div>
                <span className="text-sm text-gray-600">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                Category: {product.category}
              </span>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h2>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <dl className="divide-y divide-gray-200">
                {Object.entries(product.specifications).map(([key, value], index) => (
                  <div key={index} className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <dt className="text-sm font-medium text-gray-900">{key}</dt>
                    <dd className="text-sm text-gray-600 sm:col-span-2">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
