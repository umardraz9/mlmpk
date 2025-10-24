'use client';

import React from 'react';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface OrderSuccessModalProps {
  isOpen: boolean;
  orderNumber: string;
  proofSubmitted: boolean;
  total: number;
  cashbackEarned: number;
  savings: number;
  onClose?: () => void;
}

export default function OrderSuccessModal({
  isOpen,
  orderNumber,
  proofSubmitted,
  total,
  cashbackEarned,
  savings,
  onClose
}: OrderSuccessModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 mx-2 sm:mx-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-6 py-6 sm:py-8 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-white relative" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
            {proofSubmitted ? '🎉 Payment Proof Submitted!' : '🎉 Order Placed!'}
          </h1>
          <p className="text-green-50 text-xs sm:text-sm">Order #{orderNumber}</p>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Message */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
            <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
              {proofSubmitted
                ? `Payment proof attached for order #${orderNumber}. Your order has been sent to admin for verification.`
                : 'Thank you for choosing MCNmart! Your order has been confirmed and will be processed within 24 hours.'}
            </p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Order Summary</h3>
            </div>
            
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                <span className="font-semibold text-gray-900 dark:text-white">PKR {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Cashback Earned:</span>
                <span className="font-semibold text-green-600">+PKR {cashbackEarned.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-600 dark:text-gray-400">Total Savings:</span>
                <span className="font-semibold text-blue-600">PKR {savings.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            {proofSubmitted ? (
              // Payment proof submitted - show only "Order Placed!" button
              <Button
                onClick={() => handleNavigation('/orders')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
              >
                Order Placed!
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            ) : (
              // Regular order - show all buttons
              <>
                <Button
                  onClick={() => handleNavigation('/orders')}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
                >
                  View My Orders
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    onClick={() => handleNavigation('/products')}
                    variant="outline"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base"
                  >
                    Browse Products
                  </Button>
                  <Button
                    onClick={() => handleNavigation('/dashboard')}
                    variant="outline"
                    className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Footer note */}
          <p className="text-xs sm:text-sm text-center text-gray-500 dark:text-gray-400 leading-relaxed">
            {proofSubmitted
              ? 'You will receive an email confirmation once payment is verified.'
              : 'Check your email for order confirmation and tracking details.'}
          </p>
        </div>
      </div>
    </div>
  );
}
