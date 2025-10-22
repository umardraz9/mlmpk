'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useCart } from '@/contexts/CartContext';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Search, 
  LayoutGrid, 
  List, 
  Gift, 
  TrendingUp, 
  Check, 
  AlertTriangle,
  Info,
  RefreshCw,
  X,
  Eye,
  ChevronDown,
  Filter,
  SortAsc
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  rating: number;
  reviews: number;
  category: string;
  description: string;
  inStock: boolean;
  trending?: boolean;
  voucherEligible?: boolean;
  discount?: number;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

export default function ProductsPage() {
  const { data: session } = useSession();
  const { addToCart, cartItems, isLoading: cartLoading } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const staticCategories = [
    { id: 'all', name: 'All Products', count: 0 },
    { id: 'electronics', name: 'Electronics', count: 0 },
    { id: 'clothing', name: 'Clothing', count: 0 },
    { id: 'home-garden', name: 'Home & Garden', count: 0 },
    { id: 'health-beauty', name: 'Health & Beauty', count: 0 },
    { id: 'sports-fitness', name: 'Sports & Fitness', count: 0 },
    { id: 'books-education', name: 'Books & Education', count: 0 },
    { id: 'toys-games', name: 'Toys & Games', count: 0 },
    { id: 'automotive', name: 'Automotive', count: 0 }
  ];

  // Load products from API
  const loadProducts = async () => {
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
        throw new Error('Failed to load products');
      }
      
      const data = await response.json();
      
      const transformedProducts = data.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.comparePrice || undefined,
        images: product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
        rating: product.rating || 4.5,
        reviews: product.reviewCount || 150,
        category: product.category?.name || 'General',
        description: product.description,
        inStock: product.inStock,
        trending: product.trending || Math.random() > 0.7,
        voucherEligible: true,
        discount: product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : undefined,
      }));
      
      setProducts(transformedProducts);
      
      // Update category counts
      const updatedCategories = staticCategories.map(cat => ({
        ...cat,
        count: cat.id === 'all' ? transformedProducts.length : transformedProducts.filter((p: any) => p.category.toLowerCase().includes(cat.name.toLowerCase().split(' ')[0])).length
      }));
      setCategories(updatedCategories);
      
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchTerm]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  const openImageModal = (product: Product, imageIndex: number = 0) => {
    setSelectedProduct(product);
    setSelectedImageIndex(imageIndex);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedProduct(null);
    setSelectedImageIndex(0);
  };

  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    if (!session) {
      showNotification('error', 'Please login to add items to cart');
      return;
    }

    try {
      setAddingToCart(productId);
      const success = await addToCart(productId, quantity);
      
      if (success) {
        const product = products.find(p => p.id === productId);
        showNotification('success', `${product?.name || 'Product'} added to cart successfully!`);
      } else {
        showNotification('error', 'Failed to add product to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('error', 'Failed to add product to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const toggleFavorite = async (product: Product) => {
    if (!session) {
      showNotification('error', 'Please log in to add favorites');
      return;
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PRODUCT',
          targetId: product.id,
          action: favorites.has(product.id) ? 'remove' : 'add'
        }),
      });

      if (response.ok) {
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
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showNotification('error', 'Failed to update favorites');
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredProducts = products
    .filter(product => 
      selectedCategory === 'all' || 
      product.category.toLowerCase().includes(selectedCategory.replace('-', ' '))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'name': 
        default: return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <div className="w-64 bg-white shadow-sm border-r p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4">
                    <div className="aspect-square bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MCNmart Shop</h1>
            <p className="text-gray-600">Browse our marketplace</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-80"
              />
            </div>
            <button
              onClick={() => window.location.href = '/cart'}
              className="relative p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between',
                    selectedCategory === category.id
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span>{category.name}</span>
                  <span className="text-sm text-gray-500">{category.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="name">Name A-Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          <div className="border-t p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">View</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg',
                  viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg',
                  viewMode === 'list' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Notification */}
          {notification && (
            <div className={cn(
              'flex items-center justify-between p-4 rounded-lg mb-6',
              notification.type === 'success' ? 'bg-green-50 border border-green-200' :
              notification.type === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            )}>
              <div className="flex items-center space-x-2">
                {notification.type === 'success' && <Check className="h-5 w-5 text-green-500" />}
                {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)}>
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          )}

          {/* Products Grid */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => openImageModal(product, 0)}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.trending && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          Trending
                        </span>
                      )}
                      {product.discount && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                          {product.discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleFavorite(product)}
                      className={cn(
                        "absolute top-2 right-2 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-sm",
                        favorites.has(product.id) ? "text-red-500" : "text-gray-600"
                      )}
                    >
                      <Heart className={cn(
                        "h-4 w-4",
                        favorites.has(product.id) ? "fill-current" : ""
                      )} />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center space-x-1 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < Math.floor(product.rating) 
                                ? "text-yellow-400 fill-current" 
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({product.reviews})</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          PKR {product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            PKR {product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={!product.inStock || addingToCart === product.id}
                        className={cn(
                          "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                          product.inStock
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        )}
                      >
                        {addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={() => window.location.href = `/products/${product.id}`}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4 flex space-x-4">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                    onClick={() => openImageModal(product, 0)}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <div className="flex items-center space-x-1 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3 w-3",
                              i < Math.floor(product.rating) 
                                ? "text-yellow-400 fill-current" 
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({product.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          PKR {product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            PKR {product.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => window.location.href = `/products/${product.id}`}
                          className="border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
              <button
                onClick={closeImageModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex">
              <div className="flex-1 p-4">
                <img
                  src={selectedProduct.images[selectedImageIndex]}
                  alt={selectedProduct.name}
                  className="w-full h-96 object-contain bg-gray-50 rounded-lg"
                />
              </div>
              
              {selectedProduct.images.length > 1 && (
                <div className="w-24 p-4 border-l">
                  <div className="space-y-2">
                    {selectedProduct.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          'w-16 h-16 rounded-lg overflow-hidden border-2',
                          selectedImageIndex === index ? 'border-green-500' : 'border-gray-200'
                        )}
                      >
                        <img
                          src={image}
                          alt={`${selectedProduct.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
