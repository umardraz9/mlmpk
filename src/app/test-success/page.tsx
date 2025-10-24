'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import PaymentProofSuccessModal from '@/components/PaymentProofSuccessModal';

export default function TestSuccessPage() {
  const [showPaymentProofModal, setShowPaymentProofModal] = useState(false);
  const [showPaymentProofSuccessModal, setShowPaymentProofSuccessModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-8">
      <div className="text-center space-y-6 sm:space-y-8 w-full max-w-4xl">
        <div className="space-y-2 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Success Modal UI Preview
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Test both desktop and mobile responsive layouts
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* Payment Proof Upload Success */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Payment Proof Upload Success
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Shows immediately after user submits payment proof screenshot
              </p>
              <Button 
                onClick={() => setShowPaymentProofSuccessModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                Preview Upload Success
              </Button>
            </div>
          </div>

          {/* Payment Proof Order Success */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Order with Payment Proof
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Shows after payment proof is submitted (order summary)
              </p>
              <Button 
                onClick={() => setShowPaymentProofModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                Preview Order Summary
              </Button>
            </div>
          </div>

          {/* Regular Order Success */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Order Placed Successfully
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Shows for regular orders (Card payment, Cash on Delivery)
              </p>
              <Button 
                onClick={() => setShowOrderModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2.5 sm:py-3 text-sm sm:text-base"
              >
                Preview Order Success
              </Button>
            </div>
          </div>
        </div>

        {/* Device Testing Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 text-sm sm:text-base mb-1">📱 Mobile</h3>
            <p className="text-green-700 text-xs sm:text-sm">Optimized for phones & small screens</p>
          </div>
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 text-sm sm:text-base mb-1">💻 Desktop</h3>
            <p className="text-blue-700 text-xs sm:text-sm">Enhanced layout for larger screens</p>
          </div>
          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200 sm:col-span-2 lg:col-span-1">
            <h3 className="font-semibold text-purple-800 text-sm sm:text-base mb-1">🌙 Dark Mode</h3>
            <p className="text-purple-700 text-xs sm:text-sm">Automatic theme support</p>
          </div>
        </div>

        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 max-w-2xl mx-auto">
          <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
            <strong>Note:</strong> These are preview modals with sample data. 
            Click the buttons above to see how the success messages will appear to users on different screen sizes.
          </p>
        </div>
      </div>

      {/* Payment Proof Upload Success Modal - Shows immediately after upload */}
      <PaymentProofSuccessModal
        isOpen={showPaymentProofSuccessModal}
        orderNumber="MCN1761334682162"
        onClose={() => setShowPaymentProofSuccessModal(false)}
      />

      {/* Payment Proof Order Success Modal - Shows after user closes upload success */}
      <OrderSuccessModal
        isOpen={showPaymentProofModal}
        orderNumber="MCN241024-ABC123"
        proofSubmitted={true}
        total={2299}
        cashbackEarned={230}
        savings={400}
        onClose={() => setShowPaymentProofModal(false)}
      />

      {/* Regular Order Success Modal */}
      <OrderSuccessModal
        isOpen={showOrderModal}
        orderNumber="MCN241024-XYZ789"
        proofSubmitted={false}
        total={1850}
        cashbackEarned={185}
        savings={300}
        onClose={() => setShowOrderModal(false)}
      />
    </div>
  );
}
