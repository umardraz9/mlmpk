'use client';

import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface PaymentProofSuccessModalProps {
  isOpen: boolean;
  orderNumber: string;
  onClose?: () => void;
}

export default function PaymentProofSuccessModal({
  isOpen,
  orderNumber,
  onClose
}: PaymentProofSuccessModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 mx-2 sm:mx-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-6 py-6 sm:py-8 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-white relative" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
            ✅ Payment Proof Submitted!
          </h1>
          <p className="text-green-50 text-xs sm:text-sm">Order #{orderNumber}</p>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Message */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4 border border-green-200 dark:border-green-800">
            <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed text-center font-medium">
              Your payment proof has been successfully submitted! Our admin team will verify it within 2-4 hours and update your order status.
            </p>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Payment proof uploaded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Awaiting admin verification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                <span className="text-gray-500 dark:text-gray-400">Order will be confirmed</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            <Button
              onClick={() => handleNavigation('/orders')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base"
            >
              View My Orders
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
            You will receive an email notification once your payment is verified.
          </p>
        </div>
      </div>
    </div>
  );
}
