'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Package, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';

interface ProductHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: { id: string; name: string; count: number }[];
  favoritesCount: number;
  cartCount: number;
}

export const ProductHeader: React.FC<ProductHeaderProps> = memo(({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  favoritesCount,
  cartCount
}) => {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="MCNmart Home">
          <Image
            src="/images/Mcnmart logo.png"
            alt="MCNmart"
            width={150}
            height={32}
            className="h-8 w-auto"
          />
        </Link>

        {/* Search + Category */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for products, categories, sku..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              aria-label="Search products"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <Link
              href="/favorites"
              aria-label="Go to wishlist"
              title="Go to wishlist"
              className="inline-flex items-center justify-center h-9 rounded-md px-3 text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Heart className="h-4 w-4" />
            </Link>
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                {Math.min(favoritesCount, 99)}
              </span>
            )}
          </div>
          <div className="relative">
            <Link
              href="/checkout"
              aria-label="Go to checkout"
              title="Go to checkout"
              className="inline-flex items-center justify-center h-9 rounded-md px-3 text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
            </Link>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                {Math.min(cartCount, 99)}
              </span>
            )}
          </div>
          <Link
            href="/orders"
            aria-label="Go to orders"
            title="Go to orders"
            className="inline-flex items-center justify-center h-9 rounded-md px-3 text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Package className="h-4 w-4" />
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(session ? '/dashboard' : '/auth/login?callbackUrl=/products')}
            className="flex items-center gap-1"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{session ? 'Dashboard' : 'Login'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
});

ProductHeader.displayName = 'ProductHeader';
