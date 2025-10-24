'use client';

import React from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface CartEmptyModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function CartEmptyModal({
  isOpen,
  onClose
}: CartEmptyModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 mx-2 sm:mx-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 sm:px-6 py-6 sm:py-8 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <ShoppingCart className="h-16 w-16 sm:h-20 sm:w-20 text-white relative" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
            Cart is Empty
          </h1>
          <p className="text-orange-50 text-xs sm:text-sm">Please select your favorite products</p>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Message */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 sm:p-4 border border-orange-200 dark:border-orange-800">
            <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed text-center">
              Your cart is currently empty. Browse our amazing products and add your favorites to get started!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            <Button
              onClick={() => handleNavigation('/products')}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
            >
              Browse Products
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            
            <Button
              onClick={() => handleNavigation('/dashboard')}
              variant="outline"
              className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base"
            >
              Go to Dashboard
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-xs sm:text-sm text-center text-gray-500 dark:text-gray-400 leading-relaxed">
            Discover thousands of products at amazing prices!
          </p>
        </div>
      </div>
    </div>
  );
}
