'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import BackToDashboard from '@/components/BackToDashboard';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Heart, 
  Search, 
  Filter, 
  Star, 
  ShoppingCart, 
  BookOpen, 
  Users, 
  Target,
  Trash2,
  Eye,
  Share2,
  Calendar,
  DollarSign,
  Package,
  FileText,
  User,
  TrendingUp,
  Award,
  Gift
} from 'lucide-react';

interface FavoriteItem {
  id: string;
  type: 'product' | 'article' | 'person' | 'task';
  title: string;
  description: string;
  image?: string;
  price?: number;
  rating?: number;
  dateAdded: string;
  category: string;
  url: string;
}

type ServerFavoriteType = 'PRODUCT' | 'ARTICLE' | 'PERSON' | 'TASK' | 'POST';
type ServerFavorite = { id: string; userId: string; type: ServerFavoriteType; targetId: string; createdAt: string };

const toClientType = (t: ServerFavoriteType): FavoriteItem['type'] => {
  switch (t) {
    case 'PRODUCT': return 'product';
    case 'ARTICLE': return 'article';
    case 'PERSON': return 'person';
    case 'TASK': return 'task';
    default: return 'product';
  }
};

const toServerType = (t: 'all' | FavoriteItem['type']): ServerFavoriteType | undefined => {
  if (t === 'all') return undefined;
  switch (t) {
    case 'product': return 'PRODUCT';
    case 'article': return 'ARTICLE';
    case 'person': return 'PERSON';
    case 'task': return 'TASK';
    default: return undefined;
  }
};

export default function FavoritesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'article' | 'person' | 'task'>('all');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchFavorites = async (reset = false) => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const serverType = toServerType(filterType);
      if (serverType) params.set('type', serverType);
      if (!reset && nextCursor) params.set('cursor', nextCursor);
      params.set('limit', '50');
      const res = await fetch(`/api/favorites?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load favorites');
      const data: { items: ServerFavorite[]; nextCursor: string | null } = await res.json();

      // Fetch detailed information for each favorite item
      const mapped = await Promise.all(data.items.map(async (it): Promise<FavoriteItem> => {
        const type = toClientType(it.type);
        let title = `${type.charAt(0).toUpperCase() + type.slice(1)} • ${it.targetId.slice(-6)}`;
        let description = 'Favorited item';
        let image: string | undefined;
        let price: number | undefined;
        let rating: number | undefined;

        // Fetch detailed data based on type
        try {
          switch (it.type) {
            case 'PRODUCT':
              const productRes = await fetch(`/api/products/${it.targetId}`, { cache: 'no-store' });
              if (productRes.ok) {
                const product = await productRes.json();
                title = product.name || product.title || title;
                description = product.description || product.shortDescription || description;
                image = product.image || product.images?.[0] || product.thumbnail;
                price = product.price || product.salePrice;
                rating = product.rating || product.averageRating;
              }
              break;
            case 'ARTICLE':
              const articleRes = await fetch(`/api/blog/${it.targetId}`, { cache: 'no-store' });
              if (articleRes.ok) {
                const article = await articleRes.json();
                title = article.title || title;
                description = article.excerpt || article.description || description;
                image = article.featuredImage || article.image;
              }
              break;
            case 'PERSON':
              // For person profiles, we could fetch user data
              title = `User Profile • ${it.targetId.slice(-6)}`;
              description = 'User profile';
              break;
            case 'TASK':
              // For tasks, we could fetch task data
              title = `Task • ${it.targetId.slice(-6)}`;
              description = 'Task item';
              break;
          }
        } catch (error) {
          console.warn(`Failed to fetch details for ${it.type} ${it.targetId}:`, error);
        }

        const url = (() => {
          switch (it.type) {
            case 'PRODUCT': return `/products/${it.targetId}`;
            case 'ARTICLE': return `/blog/${it.targetId}`;
            case 'PERSON': return `/social/profile/${it.targetId}`;
            case 'TASK': return `/tasks/${it.targetId}`;
            case 'POST': return `/social/reels?post=${it.targetId}`;
            default: return '#';
          }
        })();
        const category = it.type.charAt(0) + it.type.slice(1).toLowerCase();
        
        return {
          id: it.id,
          type,
          title,
          description,
          image,
          price,
          rating,
          dateAdded: new Date(it.createdAt).toISOString().slice(0, 10),
          category,
          url,
        };
      }));

      setFavorites(prev => reset ? mapped : [...prev, ...mapped]);
      setNextCursor(data.nextCursor);
    } catch (e: any) {
      setError(e?.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load and whenever filter changes
    setNextCursor(null);
    fetchFavorites(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, session?.user?.id]);

  const filteredFavorites = useMemo(() => favorites.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  }), [favorites, searchTerm, filterType]);

  const removeFavorite = (id: string) => {
    const item = favorites.find(f => f.id === id);
    if (!item) return;
    const serverType = toServerType(item.type);
    const targetId = item.url.split('/').pop() || '';
    // optimistic
    const prev = favorites;
    setFavorites(prev => prev.filter(f => f.id !== id));
    startTransition(async () => {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: serverType, targetId, action: 'remove' }),
        });
      } catch {
        // revert on failure
        setFavorites(prev);
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product': return <ShoppingCart className="h-4 w-4" />;
      case 'article': return <BookOpen className="h-4 w-4" />;
      case 'person': return <User className="h-4 w-4" />;
      case 'task': return <Target className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'product': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'article': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'person': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'task': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatPrice = (price: number) => {
    return `PKR ${price.toLocaleString()}`;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <BackToDashboard />
      
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 flex items-center justify-center gap-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <Heart className="h-8 w-8 text-red-500" />
            My Favorites
          </h1>
          <p className={`text-lg ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>Your saved products, articles, people, and tasks</p>
        </div>

        {/* Search and Filter */}
        <Card className={`transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search favorites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  All ({favorites.length})
                </Button>
                <Button
                  variant={filterType === 'product' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('product')}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Products ({favorites.filter(f => f.type === 'product').length})
                </Button>
                <Button
                  variant={filterType === 'article' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('article')}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Articles ({favorites.filter(f => f.type === 'article').length})
                </Button>
                <Button
                  variant={filterType === 'person' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('person')}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  People ({favorites.filter(f => f.type === 'person').length})
                </Button>
                <Button
                  variant={filterType === 'task' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('task')}
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  Tasks ({favorites.filter(f => f.type === 'task').length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites Grid */}
        {filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((item) => (
              <Card key={item.id} className={`group hover:shadow-lg transition-all duration-300 ${
                isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:shadow-xl'
              }`}>
                <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-800">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                      <div className="text-center">
                        {getTypeIcon(item.type)}
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          No Image
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay gradient for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <Badge className={`${getTypeColor(item.type)} flex items-center gap-1 shadow-sm`}>
                      {getTypeIcon(item.type)}
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeFavorite(item.id)}
                      className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 shadow-sm"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    
                    <div>
                      <h3 className={`font-semibold line-clamp-2 group-hover:text-green-600 transition-colors ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.title}
                      </h3>
                      <p className={`text-sm mt-1 line-clamp-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {item.description}
                      </p>
                    </div>

                    {item.price && (
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-green-600">
                          {formatPrice(item.price)}
                        </div>
                        {item.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {item.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`flex items-center justify-between text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Added {new Date(item.dateAdded).toLocaleDateString()}
                      </span>
                      <span>{item.category}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link href={item.url} className="flex-1">
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: item.title,
                              text: item.description,
                              url: window.location.origin + item.url
                            });
                          } else {
                            navigator.clipboard.writeText(window.location.origin + item.url);
                          }
                        }}
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className={`transition-colors duration-300 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="p-12 text-center">
              <Heart className={`h-16 w-16 mx-auto mb-4 ${
                isDark ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className={`text-xl font-semibold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {searchTerm || filterType !== 'all' ? 'No matching favorites found' : 'No favorites yet'}
              </h3>
              <p className={`text-lg mb-6 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start adding items to your favorites to see them here'
                }
              </p>
              {(!searchTerm && filterType === 'all') && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/products">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Browse Products
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Read Articles
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {favorites.length > 0 && (
          <Card className={`transition-colors duration-300 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <TrendingUp className="h-5 w-5" />
                Favorites Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {favorites.filter(f => f.type === 'product').length}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Products
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {favorites.filter(f => f.type === 'article').length}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Articles
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {favorites.filter(f => f.type === 'person').length}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    People
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {favorites.filter(f => f.type === 'task').length}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tasks
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Load more */}
        {nextCursor && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => fetchFavorites(false)} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={`mt-4 text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</div>
        )}
      </div>
    </div>
  );
}
