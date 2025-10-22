'use client'

import React, { memo, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import { 
  Star, 
  Shield, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Target, 
  Crown, 
  Heart, 
  Eye,
  ShoppingCart,
  BookOpen,
  Globe,
  Zap,
  TrendingUp,
  DollarSign,
  Award,
  Landmark,
  Languages,
  Banknote,
  Play,
  HeadphonesIcon,
  Sparkles,
  BadgeCheck,
  Gem,
  Menu,
  X,
  type LucideIcon
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string;
  category?: string | { name: string };
  rating?: number;
  reviewCount: number;
  sales: number;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  publishedAt: string;
  views: number;
  likes: number;
  author: {
    name: string;
  };
  category: {
    name: string;
  };
}

interface DesktopHomePageProps {
  featuredProducts: Product[];
  featuredArticles: BlogPost[];
  loading: boolean;
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
}

// Memoized product card
const ProductCard = memo(({ product, formatPrice, isDark }: { product: Product; formatPrice: (price: number) => string; isDark: boolean }) => (
  <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
    isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200'
  }`}>
    <div className="relative h-48 overflow-hidden rounded-t-lg">
      <Image
        src={product.images || '/images/products/placeholder.svg'}
        alt={product.name}
        fill
        className="object-cover transition-transform group-hover:scale-110"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <Badge className="absolute top-2 left-2 bg-green-500 hover:bg-green-600">
        {typeof product.category === 'string' 
          ? product.category 
          : (product.category?.name ?? 'Category')}
      </Badge>
    </div>
    <CardContent className="p-4">
      <div className="space-y-3">
        <h3 className={`font-semibold line-clamp-2 group-hover:text-green-600 transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {product.name}
        </h3>
        {product.description && (
          <p className={`text-sm line-clamp-3 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>{product.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-green-600">{formatPrice(product.price)}</div>
            {product.comparePrice && product.comparePrice > product.price && (
              <div className={`text-sm line-through ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>{formatPrice(product.comparePrice)}</div>
            )}
          </div>
          <div className={`flex items-center space-x-1 text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{product.rating}</span>
            <span>({product.reviewCount})</span>
          </div>
        </div>
        
        <div className={`flex items-center justify-between text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <span>{product.sales} sold</span>
          <span className="text-green-600 font-medium">In Stock</span>
        </div>
        
        <Link href={`/products/${product.slug}`} className="block pt-2">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
            View Details
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
));

ProductCard.displayName = 'ProductCard';

// Memoized blog card
const BlogCard = memo(({ article, formatDate, isDark }: { article: BlogPost; formatDate: (dateString: string) => string; isDark: boolean }) => (
  <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
    isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200'
  }`}>
    <div className="relative h-48 overflow-hidden rounded-t-lg">
      <Image
        src={article.featuredImage || '/images/blog/placeholder.svg'}
        alt={article.title}
        fill
        className="object-cover transition-transform group-hover:scale-110"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <Badge className="absolute top-2 left-2 bg-blue-500 hover:bg-blue-600">
        {article.category.name}
      </Badge>
    </div>
    <CardContent className="p-4">
      <div className="space-y-3">
        <h3 className={`font-semibold line-clamp-2 group-hover:text-green-600 transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {article.title}
        </h3>
        {article.excerpt && (
          <p className={`text-sm line-clamp-3 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>{article.excerpt}</p>
        )}
        
        <div className={`flex items-center justify-between text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{article.author.name}</span>
            <span>•</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>{article.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-3 w-3" />
              <span>{article.likes}</span>
            </div>
          </div>
        </div>
        
        <Link href={`/blog/${article.slug}`} className="block pt-2">
          <Button variant="outline" size="sm" className={`w-full transition-colors ${
            isDark 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-green-500 hover:text-green-400' 
              : 'group-hover:bg-green-50 group-hover:border-green-200'
          }`}>
            Read More
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
));

BlogCard.displayName = 'BlogCard';

// Memoized loading skeleton
const LoadingSkeleton = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <Skeleton className="h-48 w-full" />
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Main desktop homepage component
const DesktopHomePage = memo(({ 
  featuredProducts, 
  featuredArticles, 
  loading, 
  formatPrice, 
  formatDate 
}: DesktopHomePageProps) => {
  const navigationItems = [
    { label: 'Products', href: '/products' },
    { label: 'Partnership', href: '/partnership' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ]

  const { isDark } = useTheme()
  const [cart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter();
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Clean component state without unused variables

  // Add plan to cart

  // Process payment
  const processPayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setCurrentStep(2);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        if (isMounted) {
          router.push('/dashboard');
        }
        setIsCheckoutOpen(false);
        setCurrentStep(0);
      }, 3000);
    }, 1500);
  };

  const quickActions: Array<{
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    iconGradient: string;
    iconRing: string;
    iconShadow: string;
    overlayLight: string;
    overlayDark: string;
    accentLight: string;
    accentDark: string;
    hoverBorder: string;
    hoverAccent: string;
    cta?: string;
    badge?: string;
  }> = [
    {
      title: 'Tasks',
      description: 'Complete curated tasks and unlock instant daily earnings.',
      href: '/tasks',
      icon: Target,
      iconGradient: 'from-emerald-400 to-teal-500',
      iconRing: 'ring-emerald-300/40',
      iconShadow: 'shadow-[0_18px_40px_-18px_rgba(16,185,129,0.55)]',
      overlayLight: 'bg-gradient-to-br from-emerald-200/35 via-emerald-100/10 to-transparent',
      overlayDark: 'bg-gradient-to-br from-emerald-500/25 via-emerald-400/10 to-transparent',
      accentLight: 'text-emerald-600',
      accentDark: 'text-emerald-300',
      hoverBorder: 'group-hover:border-emerald-400/50',
      hoverAccent: 'group-hover:text-emerald-400',
      cta: 'Start earning'
    },
    {
      title: 'Products',
      description: 'Shop premium products with member-only pricing and vouchers.',
      href: '/products',
      icon: ShoppingCart,
      iconGradient: 'from-sky-400 to-blue-600',
      iconRing: 'ring-sky-300/40',
      iconShadow: 'shadow-[0_18px_40px_-18px_rgba(59,130,246,0.55)]',
      overlayLight: 'bg-gradient-to-br from-blue-200/35 via-blue-100/10 to-transparent',
      overlayDark: 'bg-gradient-to-br from-blue-500/25 via-blue-400/10 to-transparent',
      accentLight: 'text-blue-600',
      accentDark: 'text-blue-300',
      hoverBorder: 'group-hover:border-blue-400/50',
      hoverAccent: 'group-hover:text-blue-400',
      cta: 'Browse catalog'
    },
    {
      title: 'Insights',
      description: 'Learn winning strategies from the MCNmart knowledge hub.',
      href: '/blog',
      icon: BookOpen,
      iconGradient: 'from-purple-400 to-fuchsia-500',
      iconRing: 'ring-purple-300/40',
      iconShadow: 'shadow-[0_18px_40px_-18px_rgba(168,85,247,0.55)]',
      overlayLight: 'bg-gradient-to-br from-purple-200/40 via-fuchsia-100/10 to-transparent',
      overlayDark: 'bg-gradient-to-br from-purple-500/25 via-fuchsia-400/10 to-transparent',
      accentLight: 'text-purple-600',
      accentDark: 'text-purple-300',
      hoverBorder: 'group-hover:border-purple-400/50',
      hoverAccent: 'group-hover:text-purple-400',
      cta: 'Read articles',
      badge: 'New'
    },
    {
      title: 'Dashboard',
      description: 'Visualize performance, track commissions, and monitor growth.',
      href: '/dashboard',
      icon: Globe,
      iconGradient: 'from-orange-400 to-amber-500',
      iconRing: 'ring-amber-300/40',
      iconShadow: 'shadow-[0_18px_40px_-18px_rgba(251,146,60,0.55)]',
      overlayLight: 'bg-gradient-to-br from-amber-200/35 via-orange-100/10 to-transparent',
      overlayDark: 'bg-gradient-to-br from-amber-500/25 via-orange-400/10 to-transparent',
      accentLight: 'text-orange-600',
      accentDark: 'text-orange-300',
      hoverBorder: 'group-hover:border-orange-400/50',
      hoverAccent: 'group-hover:text-orange-400',
      cta: 'Open dashboard'
    },
    {
      title: 'Partnership',
      description: 'Review commission levels and upgrade to unlock new tiers.',
      href: '#program',
      icon: Award,
      iconGradient: 'from-yellow-400 to-amber-400',
      iconRing: 'ring-yellow-300/40',
      iconShadow: 'shadow-[0_18px_40px_-18px_rgba(250,204,21,0.55)]',
      overlayLight: 'bg-gradient-to-br from-yellow-200/35 via-amber-100/10 to-transparent',
      overlayDark: 'bg-gradient-to-br from-yellow-500/25 via-amber-400/10 to-transparent',
      accentLight: 'text-yellow-600',
      accentDark: 'text-yellow-300',
      hoverBorder: 'group-hover:border-amber-400/50',
      hoverAccent: 'group-hover:text-amber-400',
      cta: 'View levels'
    }
  ];

  return (
    <>
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:bg-green-600 focus:text-white">Skip to content</a>

      {/* Premium Navigation Bar */}
      <header
        role="navigation"
        aria-label="Primary"
        className={`sticky top-0 z-40 backdrop-blur-xl ${
          isDark ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-gray-200'
        } border-b transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-8">
              {/* Premium Logo */}
              <Link href="/" className="group flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-2">
                    <Gem className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    MCNmart
                  </h1>
                  <p className={`text-[11px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Premium Partnership Platform</p>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className={`hidden lg:flex items-center gap-8`}>
                {navigationItems.map((item) => (
                  <Link 
                    key={item.label}
                    href={item.href}
                    className={`font-medium transition-all hover:text-emerald-600 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => router.push('/auth/login')}
                variant="ghost"
                className="font-medium hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => router.push('/auth/register')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-4 sm:px-6"
              >
                Get Started
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className={`${
            isDark ? 'bg-gray-950/95 border-gray-800' : 'bg-white/95 border-gray-200'
          } border-t lg:hidden`}
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-medium transition-all hover:text-emerald-600 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  router.push('/auth/login')
                }}
              >
                Sign In
              </Button>
            </nav>
          </div>
        )}
      </header>

      <div className={`min-h-screen scroll-smooth transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-green-50 to-blue-50'
      }`}>
        <main id="main-content" role="main" tabIndex={-1}>
        {/* Modern Hero Section */}
        <section id="hero" aria-label="Hero" className="relative pt-20 md:pt-24 pb-24 md:pb-32 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className={`absolute inset-0 bg-gradient-to-br ${
              isDark 
                ? 'from-gray-900 via-emerald-950/20 to-teal-950/20' 
                : 'from-emerald-50 via-teal-50 to-cyan-50'
            }`} />
            <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute top-40 right-20 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
            <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              {/* Hero Content */}
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <Badge className="mb-4 inline-flex w-auto px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900/50 dark:to-teal-900/50 dark:text-emerald-300 font-semibold">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Join 50,000+ Success Stories
                  </Badge>
                  <h1 className={`text-4xl md:text-5xl lg:text-7xl font-bold leading-tight ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Transform Your
                    <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Financial Future
                    </span>
                  </h1>
                  <p className={`text-base md:text-xl mt-4 md:mt-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Pakistan&apos;s premier partnership platform. Earn up to PKR 3,000 monthly with just PKR 1,000 investment. 
                    Build your network, complete tasks, and achieve financial freedom.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button 
                    onClick={() => router.push('/auth/register')}
                    className="group relative px-8 py-6 text-lg font-semibold text-white overflow-hidden rounded-xl"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 transition-transform group-hover:scale-105" />
                    <span className="relative flex items-center">
                      Start Earning Today
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                  <Button 
                    onClick={() => router.push('/auth/login')}
                    variant="outline"
                    className="px-8 py-6 text-lg font-semibold border-2 sm:hidden"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Login
                  </Button>
                  <Button 
                    onClick={() => router.push('/about')}
                    variant="outline"
                    className="px-8 py-6 text-lg font-semibold border-2 hidden sm:flex"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Watch How It Works
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-6 sm:pt-8">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      100% Secure
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5 text-emerald-600" />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Verified Business
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HeadphonesIcon className="h-5 w-5 text-emerald-600" />
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      24/7 Support
                    </span>
                  </div>
                </div>
              </div>

              {/* Hero Visual */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-600/20" />
                  <Image 
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop" 
                    alt="Success"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                    priority
                  />
                  
                  {/* Floating Stats Cards */}
                  <div className="absolute top-8 left-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 rounded-lg p-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">98%</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 right-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-100 dark:bg-teal-900/50 rounded-lg p-2">
                        <Users className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">50K+</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" aria-label="Why Choose MCNmart" className={`py-14 md:py-16 transition-colors duration-300 scroll-mt-24 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Why Choose MCNmart?</h2>
              <p className={`text-lg max-w-2xl mx-auto ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Join Pakistan&apos;s most trusted social sales platform with proven results and satisfied partners.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className={`text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200'
              }`}>
                <CardContent className="p-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-green-900/50' : 'bg-green-100'
                  }`}>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">50,000+</div>
                  <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Active Partners</div>
                </CardContent>
              </Card>
              
              <Card className={`text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200'
              }`}>
                <CardContent className="p-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                  }`}>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600">PKR 10M+</div>
                  <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Total Paid Out</div>
                </CardContent>
              </Card>
              
              <Card className={`text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200'
              }`}>
                <CardContent className="p-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-purple-900/50' : 'bg-purple-100'
                  }`}>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600">5 Levels</div>
                  <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Partnership Program</div>
                </CardContent>
              </Card>
              
              <Card className={`text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200'
              }`}>
                <CardContent className="p-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isDark ? 'bg-red-900/50' : 'bg-red-100'
                  }`}>
                    <Shield className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="text-3xl font-bold text-red-600">100%</div>
                  <div className={isDark ? 'text-gray-300' : 'text-gray-600'}>Secure Platform</div>
                </CardContent>
              </Card>
            </div>
            
          </div>
        </section>

        {/* Free Registration Notice */}
        <section className={`relative py-16 md:py-20 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 overflow-hidden`}>
          {/* Animated Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg animate-bounce"></div>
            <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-pink-400/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-10 right-10 w-28 h-28 bg-cyan-300/15 rounded-full blur-xl animate-bounce delay-500"></div>
            
            {/* Geometric Patterns */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1/4 left-1/3 w-16 h-16 border-2 border-white rotate-45 animate-spin-slow"></div>
              <div className="absolute bottom-1/3 right-1/4 w-12 h-12 border-2 border-yellow-300 rotate-12 animate-pulse"></div>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Header Section */}
            <div className="mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl animate-bounce">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                REGISTRATION IS 
                <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                  100% FREE!
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-medium">
                No signup fees, no hidden charges. Join <span className="text-yellow-300 font-bold">50,000+</span> members earning daily!
              </p>
            </div>
            
            {/* Process Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg">
                    <span className="text-3xl">👤</span>
                  </div>
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">1</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Free Account Creation</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Sign up without any cost. Create your account in just 2 minutes!</p>
                  
                  {/* Arrow for desktop */}
                  <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <ArrowRight className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg">
                    <span className="text-3xl">⚡</span>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">2</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Activate Account</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Invest just <span className="font-bold text-blue-600">PKR 1,000</span> to unlock earning potential</p>
                  
                  {/* Arrow for desktop */}
                  <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <ArrowRight className="w-4 h-4 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6 shadow-lg">
                    <span className="text-3xl">💰</span>
                  </div>
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">3</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Start Earning</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Begin earning <span className="font-bold text-purple-600">immediately</span> with daily tasks & commissions</p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12">
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white font-bold py-4 px-12 rounded-full text-xl shadow-2xl transform transition-all hover:scale-110 hover:-translate-y-1">
                  🚀 Start Your Journey FREE
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Membership Cards Section */}
        <section id="membership" aria-label="Membership Plans" className={`py-20 md:py-24 transition-colors duration-300 scroll-mt-24 relative overflow-hidden ${
          isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
        }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-100/20 to-transparent"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-semibold mb-8 shadow-lg border border-blue-200">
                <span className="mr-2">💎</span>
                Choose Your Success Path
              </div>
              <h2 className={`text-3xl sm:text-4xl md:text-6xl font-black mb-8 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Premium Membership
                </span>
                <br />
                <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                  Plans
                </span>
              </h2>
              <p className={`text-xl max-w-4xl mx-auto leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Don&apos;t miss out on this life-changing opportunity! Join Pakistan&apos;s most trusted social sales platform with proven results and satisfied partners.
              </p>
            </div>
            
            {/* Premium Membership Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
              {/* Basic Plan Card */}
              <div className={`relative rounded-3xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                {/* Popular Badge */}
                <div className="absolute -top-3 left-6">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </div>
                </div>

                  {/* Plan Icon & Header */}
                  <div className="text-center pt-6 mb-6">
                    <div className="w-12 h-12 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Basic Plan
                    </h3>
                    <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rs.1,000
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      One-time activation • Basic benefits
                    </p>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="text-center">
                      <div className="text-lg font-bold">Rs.50</div>
                      <div className="text-xs text-gray-500">Per Day</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">Rs.500</div>
                      <div className="text-xs text-gray-500">Shopping Voucher</div>
                    </div>
                  </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Daily Task Earning
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Level 1 Commission: 20%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Product Voucher
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Instant Activation
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link href="/payment?plan=basic">
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-colors">
                    Choose Basic Plan
                  </Button>
                </Link>

                {/* Trust indicators */}
                <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-500">
                  <span>• Secure</span>
                  <span>• Trusted</span>
                  <span>• Popular</span>
                </div>
              </div>

              {/* Standard Plan Card */}
              <div className={`relative rounded-3xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                {/* Recommended Badge */}
                <div className="absolute -top-3 left-6">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    RECOMMENDED
                  </div>
                </div>

                  {/* Plan Icon & Header */}
                  <div className="text-center pt-8 mb-6">
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Standard Plan
                    </h3>
                    <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rs.3,000
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      One-time activation • Enhanced benefits
                    </p>
                  </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-bold">Rs.150</div>
                    <div className="text-xs text-gray-500">Per Day</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">Rs.1K</div>
                    <div className="text-xs text-gray-500">Shopping Voucher</div>
                  </div>
                </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Daily Task Earning
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Multi-Level Commission
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Product Voucher
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Priority Support
                      </span>
                    </div>
                  </div>

                {/* CTA Button */}
                <Link href="/payment?plan=standard">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-colors">
                    Choose Standard Plan
                  </Button>
                </Link>

                {/* Trust indicators */}
                <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-500">
                  <span>• Enhanced</span>
                  <span>• Recommended</span>
                  <span>• Support</span>
                </div>
              </div>

              {/* Premium Plan Card */}
              <div className={`relative rounded-3xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                
                {/* Premium Badge */}
                <div className="absolute -top-3 left-6">
                  <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    PREMIUM
                  </div>
                </div>

                {/* Plan Header */}
                <div className="text-center pt-8 mb-6">
                  <div className="w-12 h-12 mx-auto mb-4 bg-purple-500 rounded-full flex items-center justify-center">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Premium Plan
                  </h3>
                  <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Rs.8,000
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    One-time activation • VIP benefits
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-bold">Rs.400</div>
                    <div className="text-xs text-gray-500">Per Day</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">Rs.2K</div>
                    <div className="text-xs text-gray-500">Shopping Voucher</div>
                  </div>
                </div>
                  
                {/* Features */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Daily Task Earning
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Team Commission
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Product Voucher
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      VIP Support
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link href="/payment?plan=premium">
                  <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 rounded-xl transition-colors">
                    Get Premium Plan
                  </Button>
                </Link>

                {/* Trust indicators */}
                <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-500">
                  <span>• Premium</span>
                  <span>• Exclusive</span>
                  <span>• Support</span>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className={`rounded-3xl p-8 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            } shadow-xl`}>
              <h3 className={`text-3xl font-bold text-center mb-8 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Compare Membership Plans</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b-2 ${
                      isDark ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      <th className={`text-left py-4 px-6 font-bold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Features</th>
                      <th className="text-center py-4 px-6 font-bold text-green-600">Basic</th>
                      <th className="text-center py-4 px-6 font-bold text-blue-600">Standard</th>
                      <th className="text-center py-4 px-6 font-bold text-purple-600">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={`border-b ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <td className={`py-4 px-6 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Activation Fee</td>
                      <td className="text-center py-4 px-6 font-semibold text-green-600">₨1,000</td>
                      <td className="text-center py-4 px-6 font-semibold text-blue-600">₨3,000</td>
                      <td className="text-center py-4 px-6 font-semibold text-purple-600">₨8,000</td>
                    </tr>
                    <tr className={`border-b ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <td className={`py-4 px-6 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Daily Task Earning</td>
                      <td className="text-center py-4 px-6">₨50</td>
                      <td className="text-center py-4 px-6">₨150</td>
                      <td className="text-center py-4 px-6">₨300</td>
                    </tr>
                    <tr className={`border-b ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <td className={`py-4 px-6 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Commission Levels</td>
                      <td className="text-center py-4 px-6">1 Level</td>
                      <td className="text-center py-4 px-6">3 Levels</td>
                      <td className="text-center py-4 px-6">5 Levels</td>
                    </tr>
                    <tr className={`border-b ${
                      isDark ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <td className={`py-4 px-6 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Product Voucher</td>
                      <td className="text-center py-4 px-6">₨500</td>
                      <td className="text-center py-4 px-6">₨1,500</td>
                      <td className="text-center py-4 px-6">₨3,000</td>
                    </tr>
                    <tr>
                      <td className={`py-4 px-6 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Max Monthly Earnings</td>
                      <td className="text-center py-4 px-6 font-bold text-green-600">₨5,000</td>
                      <td className="text-center py-4 px-6 font-bold text-blue-600">₨15,000</td>
                      <td className="text-center py-4 px-6 font-bold text-purple-600">₨30,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 5-Level Commission Structure */}
        <section id="program" aria-label="Partnership Program" className={`py-16 transition-colors duration-300 scroll-mt-24 ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>5-Level Partnership Program</h2>
              <p className={`text-lg max-w-2xl mx-auto ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Earn commissions from 5 levels of your network. The more you grow, the more you earn.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { level: 1, percentage: 20, amount: 200, color: 'bg-green-500' },
                { level: 2, percentage: 15, amount: 150, color: 'bg-blue-500' },
                { level: 3, percentage: 10, amount: 100, color: 'bg-purple-500' },
                { level: 4, percentage: 8, amount: 80, color: 'bg-orange-500' },
                { level: 5, percentage: 7, amount: 70, color: 'bg-red-500' },
              ].map((level) => (
                <Card key={level.level} className={`text-center hover:shadow-lg transition-all hover:-translate-y-1 ${
                  isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 ${level.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl`}>
                      {level.level}
                    </div>
                    <div className={`text-xl font-bold mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Level {level.level}</div>
                    <div className={`text-lg mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>{level.percentage}% Commission</div>
                    <div className="text-2xl font-bold text-green-600">{formatPrice(level.amount)}</div>
                    <div className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>per sale</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section
          id="actions"
          aria-label="Quick Actions"
          className={`relative py-20 transition-colors duration-300 scroll-mt-24 overflow-hidden ${
            isDark ? 'bg-gray-900' : 'bg-gradient-to-b from-white via-emerald-50/25 to-white'
          }`}
        >
          <div
            className={`absolute inset-0 pointer-events-none ${
              isDark
                ? 'bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_55%)]'
                : 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_55%)]'
            }`}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-300/40 bg-white/80 backdrop-blur-sm text-sm font-medium text-emerald-600 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Instant access to key actions
                </div>
                <h2
                  className={`mt-6 text-4xl font-bold tracking-tight leading-tight ${
                    isDark
                      ? 'text-white'
                      : 'bg-gradient-to-r from-gray-900 via-emerald-700 to-gray-900 bg-clip-text text-transparent'
                  }`}
                >
                  Navigate the entire MCNmart experience in a single tap
                </h2>
                <p className={`mt-4 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Powerful shortcuts designed for mobile convenience and desktop productivity.
                  Effortlessly move between tasks, commerce, insights, and partnership tools.
                </p>
              </div>
              <div
                className={`flex items-center gap-3 rounded-2xl px-5 py-4 shadow-lg transition-all ${
                  isDark
                    ? 'bg-gray-800/80 border border-gray-700'
                    : 'bg-white/90 border border-emerald-100'
                }`}
              >
                <div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white ${
                    'shadow-[0_18px_40px_-18px_rgba(16,185,129,0.65)]'
                  }`}
                >
                  <ArrowRight className="h-6 w-6" />
                  <div className="absolute inset-0 rounded-xl bg-white/20 blur-md" />
                </div>
                <div>
                  <p className={`text-sm font-medium uppercase tracking-[0.25em] ${
                    isDark ? 'text-emerald-300' : 'text-emerald-600'
                  }`}>Quick Launch</p>
                  <p className={`text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Optimized for touch and keyboard workflows
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href} className="group block h-full">
                    <Card
                      className={`relative h-full overflow-hidden border bg-white/95 p-[1px] transition-all duration-300 ease-out ${
                        isDark
                          ? 'border-gray-700 bg-gray-800/90 hover:bg-gray-800'
                          : 'border-emerald-100/40 hover:bg-white'
                      } ${action.hoverBorder}`}
                    >
                      <div
                        className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                          isDark ? action.overlayDark : action.overlayLight
                        }`}
                      />
                      <CardContent className="relative z-[1] flex h-full flex-col gap-6 rounded-[22px] border border-transparent bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_20px_45px_-25px_rgba(16,185,129,0.45)] dark:bg-gray-900/80">
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${
                              action.iconGradient
                            } ${action.iconShadow} text-white shadow-lg ring-4 ${action.iconRing}`}
                          >
                            <Icon className="h-7 w-7" />
                          </div>
                          {action.badge && (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                isDark
                                  ? 'bg-white/10 text-white'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {action.badge}
                            </span>
                          )}
                        </div>

                        <div className="space-y-3">
                          <h3
                            className={`text-xl font-semibold tracking-tight transition-colors ${
                              isDark ? 'text-white' : 'text-gray-900'
                            } ${action.hoverAccent}`}
                          >
                            {action.title}
                          </h3>
                          <p className={`text-sm leading-relaxed ${
                            isDark ? 'text-gray-300' : 'text-gray-600'
                          }`}
                          >
                            {action.description}
                          </p>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-2">
                          <span className={`text-sm font-semibold ${
                            isDark ? 'text-gray-100' : 'text-gray-900'
                          }`}
                          >
                            {action.cta ?? 'Explore'}
                          </span>
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                              isDark
                                ? 'border-gray-700/80 bg-gray-800 text-gray-100 group-hover:border-emerald-400/60 group-hover:text-emerald-300'
                                : 'border-emerald-100 bg-white text-emerald-600 group-hover:border-emerald-300 group-hover:text-emerald-500'
                            }`}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Website Project Information Section */}
        <section id="about-project" aria-label="About MCNmart Project" className={`py-20 transition-colors duration-300 scroll-mt-24 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
                🚀 About MCNmart Platform
              </div>
              <h2 className={`text-4xl font-bold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Pakistan&apos;s Premier Social Sales Platform</h2>
              <p className={`text-xl max-w-4xl mx-auto leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                MCNmart.com is a comprehensive social sales platform designed specifically for Pakistani entrepreneurs, 
                combining modern technology with traditional business values to create sustainable income opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
              {/* Platform Features */}
              <div className={`p-8 rounded-2xl ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gradient-to-br from-green-50 to-blue-50 border border-gray-200'
              }`}>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Platform Features</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>5-Level Partnership Program</h4>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>Earn commissions from 5 levels: 20%, 15%, 10%, 8%, 7%</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Task Earning System</h4>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>Complete daily tasks and earn PKR 50-300 based on membership</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>E-commerce Integration</h4>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>Shop quality products with voucher benefits</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Social Hub</h4>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>Connect with team members and share achievements</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Stack */}
              <div className={`p-8 rounded-2xl ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200'
              }`}>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h3 className={`text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Technical Excellence</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Next.js 15 & React 18</h4>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>Modern web framework for optimal performance</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Mobile-First Design</h4>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>Fully responsive with touch-optimized interface</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Secure Authentication</h4>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>NextAuth.js with Pakistani phone validation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>Real-time Features</h4>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>Live notifications, messaging, and updates</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  isDark ? 'text-green-400' : 'text-green-600'
                }`}>100%</div>
                <div className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Mobile Optimized</div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>50+</div>
                <div className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>API Endpoints</div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  isDark ? 'text-purple-400' : 'text-purple-600'
                }`}>15+</div>
                <div className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Major Features</div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  isDark ? 'text-orange-400' : 'text-orange-600'
                }`}>24/7</div>
                <div className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Platform Availability</div>
              </div>
            </div>

            {/* Pakistani Market Focus */}
            <div className="relative group">
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              
              <div className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-3xl transform hover:-translate-y-2 ${
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-gray-700' 
                  : 'bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 border border-green-100'
              }`}>
                
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 items-center relative z-10">
                  <div className="p-8 md:p-12 order-2 lg:order-1">
                    {/* Header with flag emoji */}
                    <div className="flex items-center mb-6">
                      <div className="text-4xl mr-4 animate-pulse">🇵🇰</div>
                      <div>
                        <h3 className={`text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Built for <span className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 bg-clip-text text-transparent">Pakistan</span>
                        </h3>
                        <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <p className={`text-lg mb-8 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Specially crafted for the Pakistani market with deep understanding of local business culture, payment preferences, and regulatory requirements.
                    </p>
                    
                    <div className="space-y-6">
                      <div className="group/item flex items-start space-x-4 p-4 rounded-2xl transition-all duration-300 hover:bg-green-50/50 dark:hover:bg-green-900/20">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover/item:scale-110 ${
                          isDark ? 'bg-gradient-to-br from-green-800 to-green-900 shadow-lg' : 'bg-gradient-to-br from-green-100 to-green-200 shadow-md'
                        }`}>
                          <Banknote className={`w-6 h-6 ${isDark ? 'text-green-300' : 'text-green-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>Local Payment Integration</h4>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Seamless integration with JazzCash, EasyPaisa, UBL Omni, and all major Pakistani payment gateways for instant transactions.
                          </p>
                        </div>
                      </div>
                      
                      <div className="group/item flex items-start space-x-4 p-4 rounded-2xl transition-all duration-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover/item:scale-110 ${
                          isDark ? 'bg-gradient-to-br from-blue-800 to-blue-900 shadow-lg' : 'bg-gradient-to-br from-blue-100 to-blue-200 shadow-md'
                        }`}>
                          <Languages className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>Bilingual Experience</h4>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Complete platform availability in both English and اردو with culturally appropriate content and terminology.
                          </p>
                        </div>
                      </div>
                      
                      <div className="group/item flex items-start space-x-4 p-4 rounded-2xl transition-all duration-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/20">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover/item:scale-110 ${
                          isDark ? 'bg-gradient-to-br from-purple-800 to-purple-900 shadow-lg' : 'bg-gradient-to-br from-purple-100 to-purple-200 shadow-md'
                        }`}>
                          <Landmark className={`w-6 h-6 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>Regulatory Compliance</h4>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Fully compliant with SBP regulations, FBR requirements, and Pakistani e-commerce laws for secure operations.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Trust indicators */}
                    <div className="flex items-center justify-start space-x-6 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>SBP Compliant</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>FBR Registered</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>SSL Secured</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-1 lg:order-2 h-80 lg:h-full relative overflow-hidden">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20"></div>
                    
                    {/* Pakistan-themed visual content */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Central Pakistan map outline */}
                      <div className="relative">
                        {/* Large Pakistan flag emoji as main visual */}
                        <div className="text-9xl mb-4 animate-pulse">🇵🇰</div>
                        
                        {/* Business icons around the flag */}
                        <div className="absolute -top-8 -left-8 text-3xl animate-bounce">💳</div>
                        <div className="absolute -top-8 -right-8 text-3xl animate-bounce delay-300">📱</div>
                        <div className="absolute -bottom-8 -left-8 text-3xl animate-bounce delay-500">🏪</div>
                        <div className="absolute -bottom-8 -right-8 text-3xl animate-bounce delay-700">💰</div>
                        
                        {/* Additional floating elements */}
                        <div className="absolute top-1/2 -left-16 text-2xl animate-pulse">🚀</div>
                        <div className="absolute top-1/2 -right-16 text-2xl animate-pulse delay-1000">⚡</div>
                      </div>
                      
                      {/* Decorative circles */}
                      <div className="absolute top-8 left-8 w-20 h-20 bg-green-400/30 rounded-full blur-xl animate-pulse"></div>
                      <div className="absolute bottom-8 right-8 w-16 h-16 bg-blue-400/30 rounded-full blur-lg animate-pulse delay-500"></div>
                      <div className="absolute top-1/2 left-4 w-12 h-12 bg-purple-400/30 rounded-full blur-md animate-bounce"></div>
                      <div className="absolute top-1/4 right-4 w-14 h-14 bg-yellow-400/30 rounded-full blur-lg animate-bounce delay-300"></div>
                      
                      {/* Text overlay */}
                      <div className="absolute bottom-6 left-6 right-6 text-center">
                        <div className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          Made in Pakistan
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          For Pakistani Entrepreneurs
                        </div>
                      </div>
                    </div>
                    
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-gradient-to-r from-green-500/50 via-blue-500/50 to-purple-500/50 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {loading ? (
          <section id="products" aria-label="Featured Products" className={`py-16 transition-colors duration-300 scroll-mt-24 ${
            isDark ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className={`text-3xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Featured Products</h2>
                <p className={`text-lg ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Loading our best-selling products...</p>
              </div>
              <LoadingSkeleton />
            </div>
          </section>
        ) : featuredProducts.length > 0 && (
          <section id="products" aria-label="Featured Products" className={`py-16 transition-colors duration-300 scroll-mt-24 ${
            isDark ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className={`text-3xl font-bold mb-4 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Featured Products</h2>
                  <p className={`text-lg ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>Discover our best-selling and trending products</p>
                </div>
                <Link href="/products">
                  <Button variant="outline" className="hover:bg-green-50 hover:border-green-200">
                    View All Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} formatPrice={formatPrice} isDark={isDark} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured Articles */}
        {loading ? (
          <section id="articles" aria-label="Latest Articles" className={`py-16 transition-colors duration-300 scroll-mt-24 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className={`text-3xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Latest Articles</h2>
                <p className={`text-lg ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>Loading our latest insights...</p>
              </div>
              <LoadingSkeleton />
            </div>
          </section>
        ) : featuredArticles.length > 0 && (
          <section id="articles" aria-label="Latest Articles" className={`py-16 transition-colors duration-300 scroll-mt-24 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className={`text-3xl font-bold mb-4 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>Latest Articles</h2>
                  <p className={`text-lg ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>Tips, strategies, and insights to help you succeed</p>
                </div>
                <Link href="/blog">
                  <Button variant="outline" className="hover:bg-green-50 hover:border-green-200">
                    View All Articles
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredArticles.map((article) => (
                  <BlogCard key={article.id} article={article} formatDate={formatDate} isDark={isDark} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section id="cta" aria-label="Call to Action" className="py-20 bg-gradient-to-r from-green-600 to-blue-600 scroll-mt-24">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <Zap className="h-10 w-10 text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Financial Future?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of successful partners who have already started their journey to financial independence. 
              Start with just PKR 1,000 and unlock unlimited earning potential.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto bg-white text-green-600 hover:bg-gray-100 font-semibold px-8">
                  Register Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/guide">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white bg-transparent text-white hover:bg-white hover:text-gray-900 font-semibold px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
        </main>

        {/* Checkout Modal */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              {/* Step 1: Cart Review */}
              {currentStep === 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Review Your Plan</h2>
                  
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-bold mb-2">{cart[0]?.name}</h3>
                    <p className="text-lg font-semibold text-green-600">{cart[0]?.price}</p>
                    <ul className="mt-3 space-y-2">
                      {cart[0]?.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 text-green-500 mt-0.5">
                            <path d="M20 6 9 17l-5-5"></path>
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      onClick={() => setIsCheckoutOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Proceed to Payment
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Payment Method */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Select Payment Method</label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md"
                      title="Choose your preferred payment method"
                      aria-label="Select payment method"
                    >
                      <option value="">Select a payment method</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="easypaisa">EasyPaisa</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                  
                  {paymentMethod && (
                    <div className="mb-6">
                      <label className="block text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <button 
                      onClick={() => setCurrentStep(0)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button 
                      onClick={processPayment}
                      disabled={!paymentMethod || !phoneNumber}
                      className={`px-4 py-2 text-white rounded-md ${!paymentMethod || !phoneNumber ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Payment Success */}
              {currentStep === 2 && (
                <div className="text-center">
                  <div className="text-6xl text-green-500 mb-4">✓</div>
                  <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                  <p className="text-gray-600 mb-6">Your {cart[0]?.name} has been activated.</p>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-6"></div>
                  <p>Redirecting to your dashboard...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer id="footer" className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">MCNmart.com</h3>
                <p className="text-gray-400 mb-4">
                  Pakistan&apos;s premier social sales platform empowering entrepreneurs to build sustainable income streams.
                </p>
                <div className="text-gray-400">
                  <p>📧 support@mcnmart.com</p>
                  <p>📞 +92 300 1234567</p>
                  <p>📍 Lahore, Pakistan</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/#program" className="text-gray-400 hover:text-white transition-colors">How It Works</Link></li>
                  <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Success Stories</Link></li>
                  <li><Link href="/#membership" className="text-gray-400 hover:text-white transition-colors">Partnership Levels</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
                  <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors">Live Chat</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/refund" className="text-gray-400 hover:text-white transition-colors">Refund Policy</Link></li>
                  <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; 2024 MCNmart.com. All rights reserved. Made with ❤️ in Pakistan.</p>
              <p className="mt-2 text-sm">Empowering Pakistani entrepreneurs since 2024</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
});

DesktopHomePage.displayName = 'DesktopHomePage';

export default DesktopHomePage;
