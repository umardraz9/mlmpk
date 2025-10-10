'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Copy, 
  Check, 
  Smartphone, 
  Building2, 
  CreditCard,
  AlertCircle,
  Info,
  Wallet,
  Shield,
  Zap,
  Star
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  accountName: string;
  accountNumber: string;
  bankName?: string;
  branchCode?: string;
  instructions?: string;
  displayOrder: number;
  monthlyLimitPkr?: number | null;
}

interface ManualPaymentOptionsProps {
  amount: number;
  onPaymentMethodSelect?: (method: PaymentMethod) => void;
  selectedMethodId?: string;
}

export default function ManualPaymentOptions({ 
  amount, 
  onPaymentMethodSelect,
  selectedMethodId 
}: ManualPaymentOptionsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string>('');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods');
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.paymentMethods);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MOBILE_WALLET':
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'BANK_ACCOUNT':
        return <Building2 className="w-5 h-5 text-green-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MOBILE_WALLET':
        return 'Mobile Wallet';
      case 'BANK_ACCOUNT':
        return 'Bank Account';
      default:
        return 'Other';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MOBILE_WALLET':
        return 'bg-blue-100 text-blue-800';
      case 'BANK_ACCOUNT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="flex items-center space-x-3 py-4">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <p className="text-orange-800">
            No payment methods are currently available. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Choose Payment Method</h2>
                <p className="text-green-100">Secure & Fast Payment Processing</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-100 text-sm">Amount to Pay</p>
              <div className="flex items-center space-x-2">
                <Badge className="bg-white/20 text-white border-white/30 text-xl font-bold px-4 py-2">
                  PKR {amount.toLocaleString()}
                </Badge>
                <Shield className="w-5 h-5 text-green-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Instructions Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-500 rounded-full">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Payment Instructions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">1</span>
                    </div>
                    <p className="text-gray-700">Send exact amount to chosen method</p>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <p className="text-gray-700">Take screenshot of confirmation</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">3</span>
                    </div>
                    <p className="text-gray-700">Upload proof in next step</p>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">4</span>
                    </div>
                    <p className="text-gray-700">Account activated after verification</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Payment Methods Accordion */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-800">Available Payment Methods</h3>
          <Badge className="bg-green-100 text-green-800 px-2 py-1">
            {paymentMethods.length} Options
          </Badge>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {paymentMethods.map((method, index) => (
            <AccordionItem 
              key={method.id} 
              value={method.id} 
              className={`border-0 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${
                selectedMethodId === method.id 
                  ? 'ring-2 ring-green-400 shadow-green-100' 
                  : 'shadow-gray-100'
              }`}
            >
              <AccordionTrigger 
                className={`px-6 py-4 hover:no-underline transition-all duration-300 ${
                  selectedMethodId === method.id 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                    : 'bg-gradient-to-r from-gray-50 to-slate-50 hover:from-blue-50 hover:to-indigo-50'
                }`}
                onClick={() => onPaymentMethodSelect?.(method)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`p-3 rounded-xl ${
                    method.type.toUpperCase() === 'MOBILE_WALLET' 
                      ? 'bg-blue-100' 
                      : 'bg-green-100'
                  }`}>
                    {getTypeIcon(method.type)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-xl font-bold text-gray-800">{method.name}</span>
                      {selectedMethodId === method.id && (
                        <div className="flex items-center space-x-1">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Selected</span>
                        </div>
                      )}
                      {index === 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs font-medium ${getTypeBadgeColor(method.type)}`}>
                        {getTypeLabel(method.type)}
                      </Badge>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-600">Instant Processing</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 pt-2">
                  {/* Account Holder */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Account Holder</p>
                      <p className="text-lg font-bold text-gray-900">{method.accountName}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-3 hover:bg-green-50 hover:border-green-300 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(method.accountName, `name-${method.id}`);
                      }}
                    >
                      {copiedField === `name-${method.id}` ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Account Number/Phone */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-700 mb-1">
                        {method.type.toUpperCase() === 'MOBILE_WALLET' ? 'Phone Number' : 'Account Number'}
                      </p>
                      <p className="text-lg font-bold text-blue-900 font-mono tracking-wider">
                        {method.accountNumber}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(method.accountNumber, `number-${method.id}`);
                      }}
                    >
                      {copiedField === `number-${method.id}` ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Bank Details */}
                  {method.bankName && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                        <p className="text-sm font-medium text-purple-700 mb-1">Bank Name</p>
                        <p className="text-base font-bold text-purple-900">{method.bankName}</p>
                      </div>
                      {method.branchCode && (
                        <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                          <p className="text-sm font-medium text-orange-700 mb-1">Branch Code</p>
                          <p className="text-base font-bold text-orange-900">{method.branchCode}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Instructions */}
                  {method.instructions && (
                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 rounded-xl">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-yellow-800 mb-1">Special Instructions:</p>
                          <p className="text-sm text-yellow-700 leading-relaxed">{method.instructions}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Monthly Limit (if available) */}
                  {typeof method.monthlyLimitPkr === 'number' && (
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        <div className="text-sm text-emerald-800">
                          Monthly limit: <span className="font-semibold">PKR {method.monthlyLimitPkr.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Amount to Send - Enhanced */}
                  <div className="relative overflow-hidden p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-green-100 text-sm font-medium mb-1">Amount to Send</p>
                          <p className="text-3xl font-bold">PKR {amount.toLocaleString()}</p>
                          <p className="text-green-100 text-xs mt-1">Send this exact amount</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(amount.toString(), `amount-${method.id}`);
                            }}
                          >
                            {copiedField === `amount-${method.id}` ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Shield className="w-6 h-6 text-green-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Enhanced Footer Note */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-500 rounded-full">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 mb-2">Important Reminder</h4>
              <p className="text-gray-700 leading-relaxed">
                Please send the <strong>exact amount</strong> shown above to ensure quick processing. 
                Any difference in amount may delay your account activation. Our team will verify 
                your payment within <strong>24 hours</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
