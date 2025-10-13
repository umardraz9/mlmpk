'use client';

import React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CreditCard, Smartphone, CheckCircle, AlertCircle, Upload, Star, Clock, Users, Target } from 'lucide-react';
import BackToDashboard from '@/components/BackToDashboard';
import ManualPaymentOptions from '@/components/ManualPaymentOptions';

interface PaymentMethod {
  method: string;
  name: string;
  description: string;
  logo: string;
  isAvailable: boolean;
}

interface MembershipPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  dailyTaskEarning: number;
  maxEarningDays: number;
  extendedEarningDays: number;
  minimumWithdrawal: number;
  voucherAmount: number;
  description: string;
  features: string[];
  referralCommissions: {
    level: number;
    amount: number;
    percentage: number;
    description: string;
  }[];
}

interface PaymentInfo {
  availablePaymentMethods: PaymentMethod[];
  investmentAmount: number;
  currency: string;
  description: string;
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<SearchParamsLoading />}>
      <PaymentPageContent />
    </Suspense>
  );
}

// Loading component for Suspense fallback
function SearchParamsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600 mb-4" />
        <p className="text-gray-600">Loading payment information...</p>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function PaymentPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');
  
  
  const [membershipPlan, setMembershipPlan] = useState<MembershipPlan | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'terms' | 'select' | 'upload'>('terms');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchPaymentInfo();
    }
  }, [status, router]);

  const fetchPaymentInfo = async () => {
    try {
      // Fetch membership plans (include inactive so all active new plans are visible)
      const plansResponse = await fetch('/api/membership-plans?includeInactive=1');
      const plansData = await plansResponse.json();
      
      if (plansData.success && plansData.plans) {
        // Get selected plan from URL parameter or localStorage
        const selectedPlanFromStorage = localStorage.getItem('selectedMembershipPlan');
        const planToFind = planParam?.toLowerCase() || selectedPlanFromStorage?.toLowerCase() || 'basic';
        
        // Find the selected plan
        const selectedPlan = plansData.plans.find((plan: MembershipPlan) => 
          plan.name.toLowerCase() === planToFind
        ) || plansData.plans[0]; // Default to first plan if not found
        
        setMembershipPlan(selectedPlan);
        
        // Set payment info based on selected plan
        setPaymentInfo({
          availablePaymentMethods: [
            {
              method: 'manual',
              name: 'Manual Payment',
              description: 'Send payment to our bank account, JazzCash, or EasyPaisa',
              logo: '',
              isAvailable: true
            }
          ],
          investmentAmount: selectedPlan.price,
          currency: 'PKR',
          description: `${selectedPlan.displayName} Membership`
        });
      } else {
        // Fallback to default plan
        const defaultPlan: MembershipPlan = {
          id: 'basic',
          name: 'BASIC',
          displayName: 'Basic Plan',
          price: 1000,
          dailyTaskEarning: 50,
          maxEarningDays: 30,
          extendedEarningDays: 60,
          minimumWithdrawal: 2000,
          voucherAmount: 500,
          description: 'Start your journey with our basic membership plan',
          features: ['Daily task earnings', 'Product voucher', 'Referral commissions', 'Basic support'],
          referralCommissions: [
            { level: 1, amount: 350, percentage: 35, description: 'Direct referral bonus' }
          ]
        };
        
        setMembershipPlan(defaultPlan);
        setPaymentInfo({
          availablePaymentMethods: [
            {
              method: 'manual',
              name: 'Manual Payment',
              description: 'Send payment to our bank account, JazzCash, or EasyPaisa',
              logo: '',
              isAvailable: true
            }
          ],
          investmentAmount: defaultPlan.price,
          currency: 'PKR',
          description: `${defaultPlan.displayName} Membership`
        });
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTermsAccept = () => {
    if (termsAccepted) {
      setPaymentStep('select');
    }
  };

  const handlePaymentMethodSelect = (method: any) => {
    setSelectedPaymentMethod(method);
    setPaymentStep('upload');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setUploadedFile(file);
      setError('');
    }
  };

  const submitPaymentProof = async () => {
    if (!uploadedFile || !selectedPaymentMethod) {
      setError('Please upload payment proof');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('paymentProof', uploadedFile);
      formData.append('paymentMethodId', selectedPaymentMethod.id);
      formData.append('amount', paymentInfo?.investmentAmount.toString() || '1000');

      const response = await fetch('/api/payment/manual-payment', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Show success message briefly, then redirect
        setSuccess('Payment proof submitted successfully. Your payment is under review. We will activate your account within 24 hours after confirmation.');
        setError('');
        // Mark pending status in localStorage for cross-page banners
        try { localStorage.setItem('pendingManualPayment', '1'); } catch {}
        setTimeout(() => {
          router.push('/dashboard?payment=pending');
        }, 1500);
      } else {
        setSuccess('');
        setError(data.error || 'Failed to submit payment proof');
      }
    } catch (err) {
      setSuccess('');
      setError('Network error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600 mb-4" />
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Unavailable</h2>
          <p className="text-gray-600 mb-4">{error || 'Payment system is currently unavailable'}</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <BackToDashboard />
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {membershipPlan?.displayName || 'Membership Plan'} - Complete Your Purchase
          </h1>
          <p className="text-gray-600 text-lg">
            {membershipPlan?.description || 'Activate your membership account'}
          </p>
        </div>

        {/* Plan Details */}
        {membershipPlan && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {membershipPlan.displayName} Details
              </CardTitle>
              <CardDescription>Complete plan information and benefits</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Plan Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    PKR {membershipPlan.price.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Investment Amount</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    PKR {membershipPlan.dailyTaskEarning}
                  </div>
                  <div className="text-sm text-gray-600">Daily Task Earning</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {membershipPlan.maxEarningDays} Days
                  </div>
                  <div className="text-sm text-gray-600">Earning Period</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    PKR {membershipPlan.voucherAmount}
                  </div>
                  <div className="text-sm text-gray-600">Product Voucher</div>
                </div>
              </div>

              {/* Plan Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Plan Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {membershipPlan.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-blue-500" />
                    {membershipPlan.maxEarningDays} days earning period (extendable to {membershipPlan.extendedEarningDays} days)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="h-4 w-4 text-purple-500" />
                    Minimum withdrawal: PKR {membershipPlan.minimumWithdrawal.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Commission Structure */}
              {membershipPlan.referralCommissions && membershipPlan.referralCommissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Referral Commission Structure
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {membershipPlan.referralCommissions.map((commission, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">
                          Level {commission.level}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {(() => {
                            const pct = typeof commission.percentage === 'number' && !Number.isNaN(commission.percentage)
                              ? commission.percentage
                              : (membershipPlan.price ? (commission.amount / membershipPlan.price) * 100 : 0);
                            return (
                              <>PKR {commission.amount} ({pct.toFixed(1)}%)</>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {commission.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Terms and Conditions */}
        {paymentStep === 'terms' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                User Agreement / Membership Terms & Conditions
              </CardTitle>
              <CardDescription>
                Please read and accept the terms and conditions before proceeding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-3">I confirm that:</h3>
                <div className="space-y-3 text-sm text-amber-700">
                  <div className="flex gap-3">
                    <span className="font-semibold">1.</span>
                    <span>I have carefully read and understood the complete details of the plan, membership levels, commission structure, and earning conditions.</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="font-semibold">2.</span>
                    <div>
                      <span>I understand that:</span>
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• Task earnings are limited to specific durations (e.g., 30 or 60 days) unless I meet the referral requirements as per the selected plan.</li>
                        <li>• Referral commissions are only earned when I successfully refer new users as required by the plan.</li>
                        <li>• If I fail to refer within the required time, my task earnings will stop automatically. However, I may still receive referral commissions if eligible.</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="font-semibold">3.</span>
                    <div>
                      <span>I agree that:</span>
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• I am purchasing this plan voluntarily and with full understanding of the system.</li>
                        <li>• The company reserves the right to change the policy at any time.</li>
                        <li>• Any fraudulent or suspicious activity may result in suspension or termination of my membership.</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="font-semibold">4.</span>
                    <span>I acknowledge that this service is being provided within the legal framework, and I have provided accurate and truthful information.</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="font-semibold">5.</span>
                    <span>By agreeing to this user agreement, I am willingly activating my membership.</span>
                  </div>
                </div>
              </div>

              {/* Checkbox and Button */}
              <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <label 
                  htmlFor="terms" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have read and agree to all the terms and conditions stated above
                </label>
              </div>

              <Button 
                onClick={handleTermsAccept}
                disabled={!termsAccepted}
                className="w-full"
                size="lg"
              >
                {termsAccepted ? 'Agree and Continue' : 'Please accept terms to continue'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Content */}
        {paymentStep === 'select' ? (
          <ManualPaymentOptions
            amount={paymentInfo.investmentAmount}
            onPaymentMethodSelect={handlePaymentMethodSelect}
            selectedMethodId={selectedPaymentMethod?.id}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Payment Proof
              </CardTitle>
              <CardDescription>
                Upload a screenshot or photo of your payment confirmation for {selectedPaymentMethod?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Payment Method Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Method:</span>
                    <span className="ml-2 font-medium">{selectedPaymentMethod?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-medium">PKR {paymentInfo.investmentAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Account:</span>
                    <span className="ml-2 font-medium">{selectedPaymentMethod?.accountName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Number:</span>
                    <span className="ml-2 font-medium font-mono">{selectedPaymentMethod?.accountNumber}</span>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="payment-proof" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Proof (Screenshot/Photo) *
                </label>
                <input
                  id="payment-proof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {uploadedFile && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ File uploaded: {uploadedFile.name}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentStep('select');
                    setSelectedPaymentMethod(null);
                    setUploadedFile(null);
                  }}
                  className="flex-1"
                >
                  Back to Payment Methods
                </Button>
                <Button
                  onClick={submitPaymentProof}
                  disabled={!uploadedFile || processing}
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Payment Proof'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success / Error Alerts */}
        {success && (
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert className="mt-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Important Notes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• This is a one-time investment required to activate your Partnership Program account</p>
            <p>• Your account will be activated immediately after successful payment</p>
            <p>• You will receive PKR 500 worth of product vouchers</p>
            <p>• Payment is secure and encrypted using Pakistani banking standards</p>
            <p>• For support, contact our customer service team</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 