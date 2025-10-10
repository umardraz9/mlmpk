'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import BackToDashboard from '@/components/BackToDashboard';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Heart, 
  X, 
  Check, 
  AlertTriangle, 
  Info,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  User,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';

// Import the simple product card (more reliable than optimized version)
import SimpleProductCard from '@/components/products/SimpleProductCard';

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

// Shape returned by /api/products
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
  tags?: string;
  slug?: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
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
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Filter state
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // Neutral reference placeholder when product has no images
  const fallbackImage = 'https://placehold.co/600x600?text=No+Image';
  // Dynamic categories computed from API results
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

        // Parse tags for colors and sizes - handle different data types
        let rawTags: string[] = [];
        if (product.tags) {
          if (typeof product.tags === 'string') {
            // If tags is a string, split by comma
            rawTags = product.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
          } else if (Array.isArray(product.tags)) {
            // If tags is already an array, use as is
            rawTags = (product.tags as unknown[]).map(t => String(t).trim()).filter(t => t.length > 0);
          } else {
            // If tags is some other type, try to convert to string first
            try {
              const tagsStr = String(product.tags);
              rawTags = tagsStr.includes(',') 
                ? tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0)
                : [tagsStr.trim()].filter(t => t.length > 0);
            } catch {
              console.warn('Could not parse tags for product:', product.id, product.tags);
              rawTags = [];
            }
          }
        }
        
        return {
          ...product,
          images: cleanedImages.length > 0 ? cleanedImages : [fallbackImage],
          hasRealImages: cleanedImages.length > 0,
          category: categoryName,
          rating: product.rating || 4.5,
          reviews: product.reviewCount || 150,
          inStock: (product.trackQuantity ? (product.quantity || 0) > 0 : true),
          originalPrice: product.comparePrice || undefined,
          discount: product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : null,
          tags: rawTags,
          slug: product.slug
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

  // Memoize extracted colors and sizes to avoid recalculation
  const availableColors = useMemo(() => 
    [...new Set(products.flatMap(p => 
      (p.tags || []).filter(tag => tag.toLowerCase().includes('color') || ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'grey'].includes(tag.toLowerCase()))
    ))], [products]
  );
  
  const availableSizes = useMemo(() => 
    [...new Set(products.flatMap(p => 
      (p.tags || []).filter(tag => ['xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large', 'extra large'].includes(tag.toLowerCase()))
    ))], [products]
  );

  // Memoize sorted and filtered products for performance
  const sortedProducts = useMemo(() => 
    products
      .filter(product => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (!(product.name.toLowerCase().includes(searchLower) ||
                 product.description?.toLowerCase().includes(searchLower))) {
            return false;
          }
        }
        
        // Price filter
        if (product.price < priceRange[0] || product.price > priceRange[1]) {
          return false;
        }
        
        // Color filter
        if (selectedColors.length > 0) {
          const productColors = (product.tags || []).filter(tag => 
            selectedColors.some(color => tag.toLowerCase().includes(color.toLowerCase()))
          );
          if (productColors.length === 0) return false;
        }
        
        // Size filter
        if (selectedSizes.length > 0) {
          const productSizes = (product.tags || []).filter(tag => 
            selectedSizes.some(size => tag.toLowerCase().includes(size.toLowerCase()))
          );
          if (productSizes.length === 0) return false;
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
      }),
    [products, searchTerm, priceRange, selectedColors, selectedSizes, sortBy]
  );

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

  // Add to favorites
  const toggleFavorite = async (product: Product) => {
    // Check if user is authenticated
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

  // Add to cart functionality (kept for future use)
  // const handleAddToCart = async (product: Product) => {
  //   if (!session) {
  //     showNotification('error', 'Please log in to add items to cart');
  //     return;
  //   }
  //   try {
  //     await addToCart(product.id);
  //     showNotification('success', 'Added to cart successfully!');
  //   } catch (error) {
  //     console.error('Error adding to cart:', error);
  //     showNotification('error', 'Failed to add to cart');
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-gray-200 rounded-lg h-96"></div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadProducts}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={cn(
          "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg",
          notification.type === 'success' && "bg-green-500 text-white",
          notification.type === 'error' && "bg-red-500 text-white",
          notification.type === 'info' && "bg-blue-500 text-white"
        )}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <Check className="h-4 w-4" />}
            {notification.type === 'error' && <AlertTriangle className="h-4 w-4" />}
            {notification.type === 'info' && <Info className="h-4 w-4" />}
            <span>{notification.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotification(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="MCNmart Home">
            <Image src="/images/Mcnmart logo.png" alt="MCNmart" width={150} height={32} className="h-8 w-auto" />
          </Link>

          {/* Search + Category */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search for products, categories, sku..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Search products"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
              aria-label="Filter by category"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Link href="/favorites" aria-label="Go to wishlist" title="Go to wishlist" className="inline-flex items-center justify-center h-9 rounded-md px-3 text-gray-900 hover:bg-gray-100">
                <Heart className="h-4 w-4" />
              </Link>
              {favorites.size > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                  {Math.min(favorites.size, 99)}
                </span>
              )}
            </div>
            <div className="relative">
              <Link href="/checkout" aria-label="Go to checkout" title="Go to checkout" className="inline-flex items-center justify-center h-9 rounded-md px-3 text-gray-900 hover:bg-gray-100">
                <ShoppingCart className="h-4 w-4" />
              </Link>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                  {Math.min(cartCount, 99)}
                </span>
              )}
            </div>
            <Link href="/orders" aria-label="Go to orders" title="Go to orders" className="inline-flex items-center justify-center h-9 rounded-md px-3 text-gray-900 hover:bg-gray-100">
              <Package className="h-4 w-4" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(session ? '/dashboard' : '/auth/login?callbackUrl=/products')}
            >
              <User className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{session ? 'Dashboard' : 'Login'}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6 space-y-6">
              {/* Categories */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Categories</h2>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors",
                        selectedCategory === category.id
                          ? "bg-green-100 text-green-800 font-medium"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <span className="text-sm text-gray-500">{category.count}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="text-md font-semibold mb-3">Price Range</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="min-price" className="text-sm text-gray-600">Min: Rs.{priceRange[0]}</label>
                    <input
                      id="min-price"
                      type="range"
                      min="0"
                      max="50000"
                      step="100"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full mt-1"
                      aria-label="Minimum price range"
                    />
                  </div>
                  <div>
                    <label htmlFor="max-price" className="text-sm text-gray-600">Max: Rs.{priceRange[1]}</label>
                    <input
                      id="max-price"
                      type="range"
                      min="0"
                      max="50000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full mt-1"
                      aria-label="Maximum price range"
                    />
                  </div>
                </div>
              </div>

              {/* Color Filter */}
              {availableColors.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold mb-3">Colors</h3>
                  <div className="space-y-2">
                    {availableColors.slice(0, 8).map((color) => (
                      <label key={color} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(color)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColors([...selectedColors, color]);
                            } else {
                              setSelectedColors(selectedColors.filter(c => c !== color));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold mb-3">Sizes</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          if (selectedSizes.includes(size)) {
                            setSelectedSizes(selectedSizes.filter(s => s !== size));
                          } else {
                            setSelectedSizes([...selectedSizes, size]);
                          }
                        }}
                        className={cn(
                          "px-3 py-1 rounded-md text-sm border transition-colors",
                          selectedSizes.includes(size)
                            ? "bg-green-100 border-green-500 text-green-800"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              <div>
                <button
                  onClick={() => {
                    setPriceRange([0, 50000]);
                    setSelectedColors([]);
                    setSelectedSizes([]);
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                  <p className="text-gray-600">{sortedProducts.length} products found</p>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex border rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort products"
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="name">Name A-Z</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            )}>
              {sortedProducts.map((product) => (
                <SimpleProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  isFavorite={favorites.has(product.id)}
                  onToggleFavorite={toggleFavorite}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onClick={(product) => router.push(`/products/${product.slug || product.id}`)}
                  fallbackImage={fallbackImage}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">{selectedProduct.name}</h2>
              <Button variant="ghost" size="sm" onClick={closeImageModal} aria-label="Close image viewer" title="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative h-96">
              <Image
                src={selectedProduct.images[selectedImageIndex] || fallbackImage}
                alt={selectedProduct.name}
                fill
                sizes="(max-width: 1280px) 100vw, 50vw"
                className="object-contain"
                priority
              />
              
              {selectedProduct.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                    disabled={selectedImageIndex === 0}
                    aria-label="Previous image"
                    title="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={() => setSelectedImageIndex(Math.min(selectedProduct.images.length - 1, selectedImageIndex + 1))}
                    disabled={selectedImageIndex === selectedProduct.images.length - 1}
                    aria-label="Next image"
                    title="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {selectedProduct.images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {selectedProduct.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 border-2 rounded overflow-hidden",
                      selectedImageIndex === index ? "border-green-500" : "border-gray-200"
                    )}
                    aria-label={`Select image ${index + 1}`}
                    title={`Select image ${index + 1}`}
                  >
                    <Image
                      src={image || fallbackImage}
                      alt={`${selectedProduct.name} ${index + 1}`}
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
      )}
    </div>
  );
}
