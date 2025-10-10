'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle, 
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';

interface MembershipPlan {
  tier: string;
  name: string;
  price: number;
  dailyTaskRate: number;
  taskEarningWithoutRef: number;
  taskEarningWithRef: number;
  totalCommission: number;
  minWithdrawal: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: MembershipPlan[];
  onPaymentSuccess: (plan: MembershipPlan) => void;
}

export function CheckoutModal({ isOpen, onClose, cartItems, onPaymentSuccess }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    accountNumber: '',
    accountName: '',
    transactionId: '',
    phoneNumber: ''
  });
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handlePayment = async () => {
    if (!paymentMethod || !paymentDetails.accountNumber) {
      alert('Please fill in all payment details');
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Process payment and send notification to admin
      const response = await fetch('/api/membership/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipTier: cartItems[0].tier,
          paymentMethod,
          paymentDetails,
          amount: totalAmount
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentComplete(true);
        setDownloadReady(true);
        
        // Send admin notification
        await fetch('/api/admin/notifications/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'PAYMENT_RECEIVED',
            membershipTier: cartItems[0].tier,
            amount: totalAmount,
            paymentMethod,
            paymentDetails
          })
        });

        // Call success callback
        onPaymentSuccess(cartItems[0]);
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadCard = async () => {
    try {
      const response = await fetch('/api/membership/download-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipTier: cartItems[0].tier,
          planName: cartItems[0].name,
          planPrice: `Rs. ${cartItems[0].price.toLocaleString()}`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MCNmart-${cartItems[0].name}-Card.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download card');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                {paymentComplete ? 'Payment Successful!' : 'Checkout'}
              </CardTitle>
              <CardDescription>
                {paymentComplete ? 'Your membership is now active' : 'Complete your membership purchase'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!paymentComplete ? (
            <>
              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold">Order Summary</h3>
                {cartItems.map((item) => (
                  <div key={item.tier} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <div className="text-sm text-gray-600">60-day membership</div>
                    </div>
                    <span className="font-bold text-green-600">Rs. {item.price.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JAZZCASH">
                      <div className="flex items-center">
                        <Smartphone className="w-4 h-4 mr-2" />
                        JazzCash
                      </div>
                    </SelectItem>
                    <SelectItem value="EASYPAISA">
                      <div className="flex items-center">
                        <Smartphone className="w-4 h-4 mr-2" />
                        EasyPaisa
                      </div>
                    </SelectItem>
                    <SelectItem value="BANK_TRANSFER">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Details */}
              {paymentMethod && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800">Payment Details</h4>
                  
                  {(paymentMethod === 'JAZZCASH' || paymentMethod === 'EASYPAISA') && (
                    <>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="+92 300 1234567"
                          value={paymentDetails.phoneNumber}
                          onChange={(e) => setPaymentDetails({...paymentDetails, phoneNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="account">Account Number</Label>
                        <Input
                          id="account"
                          placeholder="Enter your account number"
                          value={paymentDetails.accountNumber}
                          onChange={(e) => setPaymentDetails({...paymentDetails, accountNumber: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  {paymentMethod === 'BANK_TRANSFER' && (
                    <>
                      <div>
                        <Label htmlFor="account-name">Account Holder Name</Label>
                        <Input
                          id="account-name"
                          placeholder="Enter account holder name"
                          value={paymentDetails.accountName}
                          onChange={(e) => setPaymentDetails({...paymentDetails, accountName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="account-number">Account Number</Label>
                        <Input
                          id="account-number"
                          placeholder="Enter account number"
                          value={paymentDetails.accountNumber}
                          onChange={(e) => setPaymentDetails({...paymentDetails, accountNumber: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="transaction-id">Transaction ID (Optional)</Label>
                    <Input
                      id="transaction-id"
                      placeholder="Enter transaction reference"
                      value={paymentDetails.transactionId}
                      onChange={(e) => setPaymentDetails({...paymentDetails, transactionId: e.target.value})}
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Payment Instructions:</p>
                        <p>Send Rs. {totalAmount.toLocaleString()} to our {paymentMethod.replace('_', ' ')} account and enter your payment details above.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={!paymentMethod || !paymentDetails.accountNumber || processing}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 text-lg"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay Rs. {totalAmount.toLocaleString()}
                  </>
                )}
              </Button>
            </>
          ) : (
            /* Payment Success */
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center">
                <img 
                  src="/images/Mcnmart logo.png" 
                  alt="MCNmart.com" 
                  className="h-12 w-auto mb-4"
                />
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h3>
                <p className="text-gray-600">Your {cartItems[0].name} membership is now active.</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Membership Plan:</span>
                    <div className="text-sm text-gray-600">{cartItems[0].name}</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>

              {downloadReady && (
                <Button
                  onClick={handleDownloadCard}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 text-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Membership Card
                </Button>
              )}

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Continue to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
