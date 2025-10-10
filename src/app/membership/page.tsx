'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, Star, Crown, Shield, ArrowRight, Users, DollarSign, Calendar, Gift, AlertTriangle, CheckCircle, X } from 'lucide-react';

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
    description: string;
  }[];
  totalCommission: number;
  isActive: boolean;
}

export default function MembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { data: session, status } = useSession();
  type PaymentBannerStatus = 'PENDING' | 'REJECTED' | 'ACCEPTED';
  const [paymentBanner, setPaymentBanner] = useState<{ status: PaymentBannerStatus; message: string } | null>(null);

  useEffect(() => {
    fetchMembershipPlans();
  }, []);

  // Determine payment status banner for membership page
  useEffect(() => {
    if (status !== 'authenticated') return;

    // If a pending payment indicator exists, show under review
    try {
      const pending = localStorage.getItem('pendingManualPayment');
      if (pending === '1') {
        setPaymentBanner({
          status: 'PENDING',
          message: 'We have received your payment proof. Your payment is under review. We will activate your account within 24 hours after confirmation.'
        });
        return;
      }
    } catch {}

    const checkStatus = async () => {
      // Try membership details first
      try {
        const mem = await fetch('/api/user/membership', { cache: 'no-store' });
        if (mem.ok) {
          const m = await mem.json();
          const st = m?.membership?.membershipStatus;
          if (st === 'ACTIVE') {
            setPaymentBanner({ status: 'ACCEPTED', message: 'Payment accepted! Welcome — your account is now active.' });
            try { localStorage.removeItem('pendingManualPayment'); } catch {}
            return;
          }
        }
      } catch {}

      // Fallback to notifications
      try {
        const resp = await fetch('/api/notifications/display', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          const notifs = Array.isArray(data?.notifications) ? data.notifications : [];
          const hasRejected = notifs.some((n: any) => (n.title || '').toLowerCase().includes('payment rejected'));
          const hasApproved = notifs.some((n: any) => (n.title || '').toLowerCase().includes('payment approved'));
          if (hasRejected) {
            setPaymentBanner({ status: 'REJECTED', message: 'Your payment was rejected. Please resubmit correct details or contact support.' });
            try { localStorage.removeItem('pendingManualPayment'); } catch {}
            return;
          }
          if (hasApproved) {
            setPaymentBanner({ status: 'ACCEPTED', message: 'Payment accepted! Welcome — your account will be activated shortly.' });
            try { localStorage.removeItem('pendingManualPayment'); } catch {}
            return;
          }
        }
      } catch {}

      setPaymentBanner(null);
    };

    checkStatus();
  }, [status]);

  const fetchMembershipPlans = async () => {
    try {
      const response = await fetch('/api/membership-plans?includeInactive=1&includeDefaults=1');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.plans);
        // Prefer first active plan; fallback to first
        if (data.plans.length > 0) {
          const firstActive = data.plans.find((p: MembershipPlan) => p.isActive);
          setSelectedPlan((firstActive || data.plans[0]).name);
        }
      } else {
        setError('Failed to load membership plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName);
  };

  const handleContinue = async () => {
    if (selectedPlan) {
      // Store selected plan in localStorage
      localStorage.setItem('selectedMembershipPlan', selectedPlan);
      
      // Check if user is already logged in
      if (session?.user) {
        // User is logged in, update their membership plan and redirect to payment with plan parameter
        try {
          const response = await fetch('/api/user/membership', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              membershipPlan: selectedPlan
            })
          });
          
          if (response.ok) {
            // Redirect to payment page with selected plan parameter
            router.push(`/payment?plan=${selectedPlan.toLowerCase()}`);
          } else {
            console.error('Failed to update membership plan');
            // Fallback to payment page with plan parameter
            router.push(`/payment?plan=${selectedPlan.toLowerCase()}`);
          }
        } catch (error) {
          console.error('Error updating membership:', error);
          // Fallback to payment page with plan parameter
          router.push(`/payment?plan=${selectedPlan.toLowerCase()}`);
        }
      } else {
        // User is not logged in, redirect to registration
        router.push('/auth/register');
      }
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'BASIC': return <Shield className="w-8 h-8 text-green-600" />;
      case 'STANDARD': return <Star className="w-8 h-8 text-blue-600" />;
      case 'PREMIUM': return <Crown className="w-8 h-8 text-purple-600" />;
      default: return <Shield className="w-8 h-8 text-gray-600" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'BASIC': return 'green';
      case 'STANDARD': return 'blue';
      case 'PREMIUM': return 'purple';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading membership plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchMembershipPlans}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MCNmart.com</span>
            </Link>
            <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-medium">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Payment Status Banner */}
        {paymentBanner && (
          <div
            className={`rounded-xl p-4 mb-8 border-l-4 transition-all duration-300 ${
              paymentBanner.status === 'PENDING'
                ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50'
                : paymentBanner.status === 'REJECTED'
                ? 'border-red-500 bg-gradient-to-r from-red-50 to-rose-50'
                : 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  paymentBanner.status === 'PENDING'
                    ? 'bg-orange-500'
                    : paymentBanner.status === 'REJECTED'
                    ? 'bg-red-500'
                    : 'bg-green-600'
                }`}
              >
                {paymentBanner.status === 'ACCEPTED' ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold mb-1 ${
                    paymentBanner.status === 'PENDING'
                      ? 'text-orange-800'
                      : paymentBanner.status === 'REJECTED'
                      ? 'text-red-800'
                      : 'text-green-800'
                  }`}
                >
                  {paymentBanner.status === 'PENDING'
                    ? 'Payment Under Review'
                    : paymentBanner.status === 'REJECTED'
                    ? 'Payment Rejected'
                    : 'Payment Accepted — Welcome!'}
                </p>
                <p
                  className={`text-sm mb-3 ${
                    paymentBanner.status === 'PENDING'
                      ? 'text-orange-700'
                      : paymentBanner.status === 'REJECTED'
                      ? 'text-red-700'
                      : 'text-green-700'
                  }`}
                >
                  {paymentBanner.message}
                </p>

                <div className="flex flex-wrap gap-2">
                  {paymentBanner.status === 'REJECTED' && (
                    <>
                      <button onClick={() => router.push('/payment')} className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white">
                        Resubmit Proof
                      </button>
                      <button onClick={() => router.push('/support')} className="px-4 py-2 text-sm rounded-lg border">
                        Contact Support
                      </button>
                    </>
                  )}
                  {paymentBanner.status === 'ACCEPTED' && (
                    <button onClick={() => router.push('/tasks')} className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white">
                      Start Tasks
                    </button>
                  )}
                </div>
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => setPaymentBanner(null)}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your <span className="text-green-600">Partnership Plan</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start your journey with MCNmart's proven partnership program. 
            All plans include guaranteed task earnings plus bonus referral commissions.
          </p>
          
          {/* Key Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Guaranteed Daily Earnings</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Referral Bonuses</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <Gift className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Rs.500 Product Voucher</span>
            </div>
          </div>
        </div>

        {/* Membership Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.name;
            const color = getPlanColor(plan.name);
            const isPopular = plan.name === 'STANDARD';
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all cursor-pointer ${
                  isSelected 
                    ? `border-${color}-500 ring-4 ring-${color}-100 scale-105` 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
                }`}
                onClick={() => handlePlanSelect(plan.name)}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                      {getPlanIcon(plan.name)}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">Rs.{plan.price.toLocaleString()}</span>
                      <span className="text-gray-600 ml-2">one-time</span>
                    </div>

                    {/* Daily Earning Highlight */}
                    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-3 mb-4`}>
                      <div className="text-sm text-gray-600">Daily Task Earning</div>
                      <div className={`text-2xl font-bold text-${color}-600`}>Rs.{plan.dailyTaskEarning}</div>
                      <div className="text-xs text-gray-500">Guaranteed for {plan.maxEarningDays}-{plan.extendedEarningDays} days</div>
                    </div>
                  </div>

                  {/* Earning Breakdown */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">30 Days Earning:</span>
                      <span className="font-semibold">Rs.{(plan.dailyTaskEarning * 30).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">60 Days (with referral):</span>
                      <span className="font-semibold text-green-600">Rs.{(plan.dailyTaskEarning * 60).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Referral Commissions:</span>
                      <span className="font-semibold text-blue-600">Rs.{plan.totalCommission}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-600">Min. Withdrawal:</span>
                      <span className="font-semibold">Rs.{plan.minimumWithdrawal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className={`w-5 h-5 text-${color}-600 flex-shrink-0 mt-0.5`} />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Commission Structure */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Referral Commission Structure</h4>
                    <div className="grid grid-cols-5 gap-1 text-xs">
                      {plan.referralCommissions.map((comm) => (
                        <div key={comm.level} className="text-center">
                          <div className={`bg-${color}-100 text-${color}-800 rounded px-1 py-1`}>
                            L{comm.level}
                          </div>
                          <div className="text-gray-600 mt-1">Rs.{comm.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className={`mt-6 ${plan.isActive ? `bg-${color}-600 text-white` : 'bg-gray-300 text-gray-700'} text-center py-2 rounded-lg font-medium`}>
                      {plan.isActive ? 'Selected Plan' : 'Selected (Inactive)'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Important Notes */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Important Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">✅ Guaranteed Task Earnings</h4>
              <p className="text-gray-600 text-sm">
                Task earnings are guaranteed and you will receive them even if you don't refer anyone. 
                This is your primary income source.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🎁 Bonus Referral Earnings</h4>
              <p className="text-gray-600 text-sm">
                Referral commissions are extra bonus income on top of your task earnings. 
                Build your network to maximize your income.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📅 Earning Extension</h4>
              <p className="text-gray-600 text-sm">
                Your earning period extends from 30 to 60 days when you successfully refer others. 
                Double your earning potential!
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🛡️ Legal Compliance</h4>
              <p className="text-gray-600 text-sm">
                All plans comply with Pakistani business regulations. 
                Focus on genuine partnerships and quality services.
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedPlan || !plans.find(p => p.name === selectedPlan)?.isActive}
            className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-xl transition-all ${
              selectedPlan && plans.find(p => p.name === selectedPlan)?.isActive
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue with {plans.find(p => p.name === selectedPlan)?.displayName || 'Selected Plan'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          {!plans.find(p => p.name === selectedPlan)?.isActive && (
            <p className="text-sm text-red-600 mt-3">This plan is currently inactive. Please choose an active plan to continue.</p>
          )}
          
          <p className="text-sm text-gray-600 mt-4">
            You can change your plan later or upgrade anytime
          </p>
        </div>
      </div>
    </div>
  );
}
