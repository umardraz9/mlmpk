'use client';

import React, { memo } from 'react';
import { CheckCircle, Package, Truck, CreditCard, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlacedOrder {
  id: string;
  orderNumber: string;
}

interface OrderSuccessCardProps {
  placedOrder: PlacedOrder;
  proofSubmitted: boolean;
  paymentMethod: string;
  onContinueShopping: () => void;
  onViewOrder: () => void;
}

export const OrderSuccessCard: React.FC<OrderSuccessCardProps> = memo(({
  placedOrder,
  proofSubmitted,
  paymentMethod,
  onContinueShopping,
  onViewOrder
}) => {
  const isManualPayment = ['jazzcash', 'easypaisa', 'bank'].includes(paymentMethod);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Order Placed Successfully!
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Thank you for your order. We've received your request and will process it soon.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Order Number:</span>
              <Badge variant="secondary" className="font-mono">
                {placedOrder.orderNumber}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Order ID:</span>
              <span className="text-sm font-medium font-mono">{placedOrder.id}</span>
            </div>
          </div>

          {/* Payment Status */}
          {isManualPayment && (
            <Alert className={proofSubmitted ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'}>
              <AlertCircle className={`h-4 w-4 ${proofSubmitted ? 'text-green-600' : 'text-yellow-600'}`} />
              <AlertDescription>
                <div className="space-y-2">
                  {proofSubmitted ? (
                    <>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Payment Proof Submitted
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        We have received your payment proof. Your order will be processed within 24 hours after payment verification.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Payment Verification Pending
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Please complete your payment and upload the proof to process your order.
                      </p>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="font-semibold text-left">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CreditCard className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Payment Processing</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {isManualPayment 
                      ? 'We will verify your payment within 24 hours'
                      : 'Your payment will be processed automatically'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package className="w-3 h-3 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Order Preparation</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Your items will be carefully packed and prepared for shipment
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Truck className="w-3 h-3 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Shipping & Delivery</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Your order will be shipped and delivered to your address
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={onViewOrder}
              className="flex-1"
            >
              View Order Details
            </Button>
            <Button
              variant="outline"
              onClick={onContinueShopping}
              className="flex-1"
            >
              Continue Shopping
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t">
            <p>
              You will receive email updates about your order status. 
              For any questions, please contact our customer support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

OrderSuccessCard.displayName = 'OrderSuccessCard';
