'use client';

import React, { memo, useState } from 'react';
import { CreditCard, Banknote, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface PaymentSettingOption {
  id: string;
  name?: string;
  type: string;
  accountName?: string;
  accountTitle?: string;
  accountNumber?: string;
  bankName?: string | null;
  branchCode?: string | null;
  instructions?: string | null;
}

interface PaymentMethodCardProps {
  paymentMethod: 'jazzcash' | 'easypaisa' | 'bank' | 'card' | 'cod';
  onPaymentMethodChange: (method: 'jazzcash' | 'easypaisa' | 'bank' | 'card' | 'cod') => void;
  paymentSettings: PaymentSettingOption[];
  selectedPaymentSettingId: string;
  onPaymentSettingChange: (id: string) => void;
  showManualUpload: boolean;
  onShowManualUpload: (show: boolean) => void;
  manualProofFile: File | null;
  onProofFileChange: (file: File | null) => void;
  isProcessing?: boolean;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = memo(({
  paymentMethod,
  onPaymentMethodChange,
  paymentSettings,
  selectedPaymentSettingId,
  onPaymentSettingChange,
  showManualUpload,
  onShowManualUpload,
  manualProofFile,
  onProofFileChange,
  isProcessing = false
}) => {
  const [dragOver, setDragOver] = useState(false);

  const paymentOptions = [
    { id: 'jazzcash', name: 'JazzCash', icon: '📱', color: 'bg-orange-500' },
    { id: 'easypaisa', name: 'EasyPaisa', icon: '💳', color: 'bg-green-500' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', color: 'bg-blue-500' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', color: 'bg-purple-500' },
    { id: 'cod', name: 'Cash on Delivery', icon: '💵', color: 'bg-gray-500' }
  ];

  const selectedOption = paymentSettings.find(opt => opt.id === selectedPaymentSettingId);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onProofFileChange(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onProofFileChange(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const getPaymentMethodIcon = (method: string) => {
    const option = paymentOptions.find(opt => opt.id === method);
    return option?.icon || '💳';
  };

  const getPaymentMethodColor = (method: string) => {
    const option = paymentOptions.find(opt => opt.id === method);
    return option?.color || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paymentOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onPaymentMethodChange(option.id as any)}
              disabled={isProcessing}
              className={`p-4 rounded-lg border-2 transition-all ${
                paymentMethod === option.id
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center text-white text-lg`}>
                  {option.icon}
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{option.name}</p>
                  {paymentMethod === option.id && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Manual Payment Options */}
        {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa' || paymentMethod === 'bank') && (
          <div className="space-y-4">
            {paymentSettings.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Select {paymentMethod === 'bank' ? 'Bank Account' : 'Mobile Wallet'}
                </Label>
                <div className="space-y-2">
                  {paymentSettings
                    .filter(setting => setting.type === paymentMethod)
                    .map((setting) => (
                      <button
                        key={setting.id}
                        type="button"
                        onClick={() => {
                          onPaymentSettingChange(setting.id);
                          onShowManualUpload(true);
                        }}
                        disabled={isProcessing}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          selectedPaymentSettingId === setting.id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getPaymentMethodColor(paymentMethod)} flex items-center justify-center text-white text-sm`}>
                            {getPaymentMethodIcon(paymentMethod)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {setting.accountTitle || setting.accountName || setting.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {setting.accountNumber}
                              {setting.bankName && ` - ${setting.bankName}`}
                            </p>
                          </div>
                          {selectedPaymentSettingId === setting.id && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Payment Instructions */}
            {selectedOption && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Payment Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Transfer the exact amount to the selected account</li>
                      <li>Take a screenshot of the successful transaction</li>
                      <li>Upload the screenshot below</li>
                      <li>Your order will be processed after payment verification</li>
                    </ol>
                    {selectedOption.instructions && (
                      <p className="text-sm mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <strong>Note:</strong> {selectedOption.instructions}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* File Upload */}
            {showManualUpload && selectedPaymentSettingId && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Upload Payment Proof <span className="text-red-500">*</span>
                </Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {manualProofFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {manualProofFile.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {(manualProofFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onProofFileChange(null)}
                        disabled={isProcessing}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Drag and drop your payment screenshot here, or{' '}
                        <label className="text-green-600 hover:text-green-700 cursor-pointer underline">
                          browse files
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isProcessing}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500">
                        Supported formats: JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cash on Delivery Info */}
        {paymentMethod === 'cod' && (
          <Alert>
            <Banknote className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-sm">
                  Pay with cash when your order is delivered to your doorstep. 
                  Please have the exact amount ready for the delivery person.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Card Payment Info */}
        {paymentMethod === 'card' && (
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Credit/Debit Card Payment</p>
                <p className="text-sm">
                  You will be redirected to a secure payment gateway to complete your transaction.
                  We accept Visa, MasterCard, and local bank cards.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
});

PaymentMethodCard.displayName = 'PaymentMethodCard';
