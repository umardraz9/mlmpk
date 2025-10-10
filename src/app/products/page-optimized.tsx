'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';

// Import optimized components
import { ProductHeader } from './ProductHeader';
import { ProductFilters } from './ProductFilters';
import { ProductControls } from './ProductControls';
import { ProductCard } from './ProductCard';
import { ImageModal } from './ImageModal';
import { NotificationSystem } from './NotificationSystem';
import { ProductsSkeleton } from './ProductsSkeleton';

// Types
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
  slug?: string;
}

interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  images?: string[] | string | null;
  categoryId?: string;
  category?: { id: string; name: string; slug: string; color?: string | null } | string;
  trackQuantity?: boolean;
  quantity?: number;
  status?: string;
  rating?: number;
  reviewCount?: number;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { addToCart, cartCount } = useCart();

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fallbackImage = 'https://placehold.co/600x600?text=No+Image';
  const [categories, setCategories] = useState<Category[]>([{ id: 'all', name: 'All Products', count: 0 }]);

  // Load products from API
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (selectedCategory !== 'all') {
        searchParams.append('category', selectedCategory);
      }
      if (searchTerm) {
        searchParams.append('search', searchTerm);
      }

      const response = await fetch(`/api/products?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      // Transform products to match our interface and sanitize images
      const transformedProducts: Product[] = (data.products as ApiProduct[]).map((product) => {
        const rawImages = Array.isArray(product.images)
          ? product.images
          : (product.images ? [product.images] : []);
        const isValidUrl = (u: unknown) => typeof u === 'string'
          && u.trim().length > 0
          && (u.startsWith('/') || u.startsWith('http://') || u.startsWith('https://'))
          && u !== '[]'
          && u !== '"[]"';
        const cleanedImages = rawImages.filter(isValidUrl as (u: unknown) => u is string);

        const categoryName = typeof product.category === 'string'
          ? product.category
          : (product.category?.name || 'Uncategorized');

        return {
          ...product,
          images: cleanedImages.length > 0 ? cleanedImages : [fallbackImage],
          hasRealImages: cleanedImages.length > 0,
          category: categoryName,
          rating: product.rating || 4.5,
          reviews: product.reviewCount || 150,
          inStock: (product.trackQuantity ? (product.quantity || 0) > 0 : true),
          originalPrice: product.comparePrice || undefined,
          discount: product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : null
        } as Product;
      });

      setProducts(transformedProducts);

      // Compute dynamic categories with counts keyed by categoryId from API
      const counts = new Map<string, { name: string; count: number }>();
      for (const p of transformedProducts) {
        const id = (p.categoryId as string) || 'uncategorized';
        const name = (p.category as string) || 'Uncategorized';
        const prev = counts.get(id);
        counts.set(id, { name, count: (prev?.count || 0) + 1 });
      }
      const computed: Category[] = [
        { id: 'all', name: 'All Products', count: transformedProducts.length },
        ...Array.from(counts.entries()).map(([id, meta]) => ({
          id,
          name: meta.name,
          count: meta.count,
        }))
      ];
      setCategories(computed);

    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  // Sort and filter products
  const sortedProducts = products
    .filter(product => {
      if (searchTerm) {
        return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Image modal functions
  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedProduct(null);
    setSelectedImageIndex(0);
  };

  // Show notification helper
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  // Cart actions
  const handleAddToCart = async (product: Product) => {
    if (!session) {
      showNotification('error', 'Please log in to add items to cart');
      router.push('/auth/login?callbackUrl=/products');
      return;
    }
    try {
      const ok = await addToCart(product.id, 1);
      if (ok) {
        showNotification('success', `${product.name} added to cart`);
      } else {
        showNotification('error', 'Failed to add to cart');
      }
    } catch (e) {
      console.error('Add to cart failed', e);
      showNotification('error', 'Failed to add to cart');
    }
  };

  const handleBuyNow = async (product: Product) => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/checkout`);
      return;
    }
    try {
      const ok = await addToCart(product.id, 1);
      if (ok) {
        router.push('/checkout');
      } else {
        showNotification('error', 'Could not proceed to checkout');
      }
    } catch (e) {
      console.error('Buy now failed', e);
      showNotification('error', 'Could not proceed to checkout');
    }
  };

  // Add to favorites
  const toggleFavorite = async (product: Product) => {
    if (!session) {
      showNotification('error', 'Please log in to add favorites');
      return;
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'PRODUCT',
          targetId: product.id,
          action: favorites.has(product.id) ? 'remove' : 'add'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update favorites');
      }

      const result = await response.json();

      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (result.favorited) {
          newFavorites.add(product.id);
          showNotification('success', `${product.name} added to favorites!`);
        } else {
          newFavorites.delete(product.id);
          showNotification('info', `${product.name} removed from favorites`);
        }
        return newFavorites;
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to update favorites');
    }
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (session) {
        try {
          const response = await fetch('/api/favorites');
          if (response.ok) {
            const data = await response.json();
            interface FavoriteItem { targetId?: string; productId?: string }
            const src: FavoriteItem[] = Array.isArray(data.items)
              ? data.items
              : (Array.isArray(data.favorites) ? data.favorites : []);
            const favoriteIds = new Set<string>(
              src
                .map((fav) => fav.targetId || fav.productId)
                .filter((v): v is string => typeof v === 'string' && v.length > 0)
            );
            setFavorites(favoriteIds);
          }
        } catch (error) {
          console.error('Error loading favorites:', error);
        }
      }
    };
    loadFavorites();
  }, [session]);

  // Loading state
  if (loading) {
    return <ProductsSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadProducts} className="bg-green-600 hover:bg-green-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification System */}
      <NotificationSystem
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* Header */}
      <ProductHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        favoritesCount={favorites.size}
        cartCount={cartCount}
      />

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Suspense fallback={<div className="bg-white rounded-lg shadow-sm border p-6"><div className="animate-pulse space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}</div></div>}>
            <ProductFilters
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </Suspense>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Controls */}
            <Suspense fallback={<div className="bg-white rounded-lg shadow-sm border p-6 mb-6 animate-pulse"><div className="h-20 bg-gray-200 rounded"></div></div>}>
              <ProductControls
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                productCount={sortedProducts.length}
              />
            </Suspense>

            {/* Products Grid */}
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid'
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            )}>
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={favorites.has(product.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No products found matching your criteria.</p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        product={selectedProduct}
        isOpen={showImageModal}
        onClose={closeImageModal}
        selectedImageIndex={selectedImageIndex}
        onImageIndexChange={setSelectedImageIndex}
      />
    </div>
  );
}
