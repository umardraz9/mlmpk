'use client';

import React, { memo } from 'react';
import { Calculator, Gift, Truck, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrderSummary {
  subtotal: number;
  voucherDiscount: number;
  shipping: number;
  total: number;
  cashbackEarned: number;
  savings: number;
}

interface OrderSummaryCardProps {
  orderSummary: OrderSummary;
  voucherUsed: number;
  voucherBalance: number;
  onVoucherChange: (amount: number) => void;
  isProcessing?: boolean;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = memo(({
  orderSummary,
  voucherUsed,
  voucherBalance,
  onVoucherChange,
  isProcessing = false
}) => {
  const handleMaxVoucher = () => {
    const maxAmount = Math.min(voucherBalance, orderSummary.subtotal);
    onVoucherChange(maxAmount);
  };

  const handleClearVoucher = () => {
    onVoucherChange(0);
  };

  const handleVoucherInputChange = (value: string) => {
    const raw = Number(value || 0);
    const capped = Math.max(0, Math.min(raw, Math.min(voucherBalance, orderSummary.subtotal)));
    onVoucherChange(capped);
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voucher Section */}
        {voucherBalance > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-green-600" />
              <Label htmlFor="voucherUsed" className="text-sm font-medium text-green-800 dark:text-green-200">
                Use Voucher Balance
              </Label>
              <Badge variant="secondary" className="ml-auto">
                Available: PKR {voucherBalance.toLocaleString()}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                id="voucherUsed"
                type="number"
                min={0}
                max={Math.min(voucherBalance, orderSummary.subtotal)}
                value={voucherUsed}
                onChange={(e) => handleVoucherInputChange(e.target.value)}
                className="flex-1"
                placeholder="Enter amount"
                disabled={isProcessing}
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleMaxVoucher}
                disabled={isProcessing}
              >
                Max
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleClearVoucher}
                disabled={isProcessing}
              >
                Clear
              </Button>
            </div>
            {voucherUsed > voucherBalance && (
              <p className="text-xs text-red-600 mt-1">
                Amount exceeds available voucher balance.
              </p>
            )}
          </div>
        )}

        {/* Order Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium">PKR {orderSummary.subtotal.toLocaleString()}</span>
          </div>

          {orderSummary.voucherDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Voucher Discount:</span>
              <span className="font-medium">-PKR {orderSummary.voucherDiscount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Shipping:
            </span>
            <span className="font-medium">
              {orderSummary.shipping === 0 ? 'FREE' : `PKR ${orderSummary.shipping.toLocaleString()}`}
            </span>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-green-600">PKR {orderSummary.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Benefits Section */}
        {(orderSummary.cashbackEarned > 0 || orderSummary.savings > 0) && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-1">
              <Star className="w-4 h-4" />
              Your Benefits
            </h4>
            <div className="space-y-1 text-sm">
              {orderSummary.cashbackEarned > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-300">Cashback Earned:</span>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    PKR {orderSummary.cashbackEarned.toLocaleString()}
                  </span>
                </div>
              )}
              {orderSummary.savings > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-600 dark:text-blue-300">Total Savings:</span>
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    PKR {orderSummary.savings.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OrderSummaryCard.displayName = 'OrderSummaryCard';
