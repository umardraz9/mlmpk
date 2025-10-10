'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Heart,
  ShoppingCart,
  Package,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';

interface ProductHeaderProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  selectedCategory?: string;
  categories?: Array<{ id: string; name: string; count: number }>;
  onCategoryChange?: (category: string) => void;
  showSearch?: boolean;
  showCategories?: boolean;
  title?: string;
  subtitle?: string;
}

export default function ProductHeader({
  searchTerm = '',
  onSearchChange,
  selectedCategory = 'all',
  categories = [],
  onCategoryChange,
  showSearch = true,
  showCategories = false,
  title = 'Products',
  subtitle
}: ProductHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { cartCount } = useCart();

  return (
    <>
      {/* Top Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="MCNmart Home">
            <Image src="/images/Mcnmart logo.png" alt="MCNmart" width={150} height={32} className="h-8 w-auto" />
          </Link>

          {/* Search + Category */}
          {showSearch && (
            <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search for products, categories, sku..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-9"
                  aria-label="Search products"
                />
              </div>
              {showCategories && categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange?.(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                  aria-label="Filter by category"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Link href="/favorites" aria-label="Go to wishlist" title="Go to wishlist" className="inline-flex items-center justify-center h-9 rounded-md px-3 text-gray-900 hover:bg-gray-100">
                <Heart className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative">
              <Link href="/cart" aria-label="Go to cart" title="Go to cart" className="inline-flex items-center justify-center h-9 rounded-md px-3 text-gray-900 hover:bg-gray-100">
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

      {/* Page Header */}
      {title && (
        <div className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-600">{subtitle}</p>}
              </div>

              {showSearch && onSearchChange && (
                <div className="flex items-center gap-4">
                  {/* Mobile Search */}
                  <div className="relative md:hidden">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>

                  {/* View Mode Toggle - if needed */}
                  {/* Sort Dropdown - if needed */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
