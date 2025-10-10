'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Check, ArrowRight, TrendingUp, Gift, 
  Clock, AlertCircle, Crown, Zap, RefreshCw 
} from 'lucide-react';

interface RenewalOption {
  planName: string;
  displayName: string;
  basePrice: number;
  renewalPrice: number;
  discountPercentage: number;
  savings: number;
  isCurrentPlan: boolean;
  isUpgrade: boolean;
  isDowngrade: boolean;
  dailyTaskEarning: number;
  maxEarningDays: number;
  extendedEarningDays: number;
  minimumWithdrawal: number;
  voucherAmount: number;
  features: string[];
}

interface RenewalData {
  currentPlan: string;
  membershipStatus: string;
  renewalCount: number;
  daysUntilExpiration: number;
  canRenew: boolean;
  renewalOptions: RenewalOption[];
}

export default function MembershipRenewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [renewalData, setRenewalData] = useState<RenewalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchRenewalOptions();
    }
  }, [status, router]);

  const fetchRenewalOptions = async () => {
    try {
      const response = await fetch('/api/user/membership/renew');
      const data = await response.json();

      if (data.success) {
        setRenewalData(data);
        // Auto-select current plan
        const currentPlanOption = data.renewalOptions.find((opt: RenewalOption) => opt.isCurrentPlan);
        if (currentPlanOption) {
          setSelectedPlan(currentPlanOption.planName);
        }
      }
    } catch (error) {
      console.error('Error fetching renewal options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const selectedOption = renewalData?.renewalOptions.find(opt => opt.planName === selectedPlan);
      
      const response = await fetch('/api/user/membership/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: selectedPlan,
          paymentMethod: 'manual', // This should be selected by user
          paymentDetails: 'Renewal payment',
          isUpgrade: selectedOption?.isUpgrade
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show success message and redirect
        alert(data.message);
        router.push('/dashboard');
      } else {
        alert(data.error || 'Failed to renew membership');
      }
    } catch (error) {
      console.error('Error renewing membership:', error);
      alert('An error occurred while renewing membership');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading renewal options...</div>
      </div>
    );
  }

  if (!renewalData || !renewalData.canRenew) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Active Membership</h2>
          <p className="text-gray-300 mb-6">You don't have an active or expired membership to renew.</p>
          <button
            onClick={() => router.push('/membership')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            View Membership Plans
          </button>
        </div>
      </div>
    );
  }

  const selectedOption = renewalData.renewalOptions.find(opt => opt.planName === selectedPlan);
  const isExpired = renewalData.membershipStatus === 'EXPIRED';
  const isExpiringSoon = renewalData.daysUntilExpiration <= 7 && renewalData.daysUntilExpiration > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">Membership Renewal</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isExpired ? 'Renew Your Membership' : 'Extend Your Success'}
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {isExpired 
              ? 'Your membership has expired. Renew now to continue earning!'
              : `${renewalData.daysUntilExpiration} days remaining. Renew early and keep your earning streak!`}
          </p>

          {/* Renewal Count Badge */}
          {renewalData.renewalCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-yellow-500/30">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">
                Loyal Member - {renewalData.renewalCount} Renewal{renewalData.renewalCount > 1 ? 's' : ''}
              </span>
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
          )}
        </motion.div>

        {/* Expiration Warning */}
        {(isExpired || isExpiringSoon) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-3xl mx-auto mb-8 p-6 rounded-2xl border-2 ${
              isExpired 
                ? 'bg-red-500/10 border-red-500/50' 
                : 'bg-yellow-500/10 border-yellow-500/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isExpired ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                <Clock className={`w-6 h-6 ${isExpired ? 'text-red-400' : 'text-yellow-400'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 ${isExpired ? 'text-red-400' : 'text-yellow-400'}`}>
                  {isExpired ? 'Membership Expired' : 'Expiring Soon!'}
                </h3>
                <p className="text-gray-300">
                  {isExpired 
                    ? 'Your membership has expired. Renew now to resume task earnings and maintain your benefits.'
                    : `Your membership expires in ${renewalData.daysUntilExpiration} days. Renew now to avoid interruption.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Renewal Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {renewalData.renewalOptions.map((option, index) => (
            <motion.div
              key={option.planName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedPlan(option.planName)}
              className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 ${
                selectedPlan === option.planName
                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-105'
                  : 'bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30'
              }`}
            >
              {/* Current Plan Badge */}
              {option.isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-1 rounded-full text-xs font-bold text-white">
                  Current Plan
                </div>
              )}

              {/* Upgrade/Downgrade Badge */}
              {option.isUpgrade && (
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Upgrade
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{option.displayName}</h3>
                
                {/* Pricing */}
                <div className="mb-4">
                  {option.savings > 0 ? (
                    <>
                      <div className="text-gray-400 line-through text-lg">Rs.{option.basePrice}</div>
                      <div className="text-4xl font-bold text-white">Rs.{option.renewalPrice}</div>
                      <div className="text-emerald-400 font-semibold mt-1">
                        Save Rs.{option.savings} ({option.discountPercentage}% OFF)
                      </div>
                    </>
                  ) : (
                    <div className="text-4xl font-bold text-white">Rs.{option.renewalPrice}</div>
                  )}
                </div>

                {/* Daily Earning */}
                <div className="bg-white/10 rounded-xl p-3 mb-4">
                  <div className="text-gray-400 text-sm">Daily Task Earning</div>
                  <div className="text-2xl font-bold text-emerald-400">Rs.{option.dailyTaskEarning}</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {option.features.slice(0, 4).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Select Button */}
              <button
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  selectedPlan === option.planName
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {selectedPlan === option.planName ? 'Selected' : 'Select Plan'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Renewal Summary & Action */}
        {selectedOption && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Renewal Summary</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Selected Plan:</span>
                <span className="text-white font-semibold">{selectedOption.displayName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Renewal Type:</span>
                <span className="text-white font-semibold">
                  {selectedOption.isUpgrade ? 'Upgrade' : selectedOption.isCurrentPlan ? 'Renewal' : 'Downgrade'}
                </span>
              </div>

              {selectedOption.savings > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Loyalty Discount:</span>
                  <span className="text-emerald-400 font-semibold">-Rs.{selectedOption.savings} ({selectedOption.discountPercentage}%)</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Voucher Bonus:</span>
                <span className="text-white font-semibold flex items-center gap-1">
                  <Gift className="w-4 h-4 text-yellow-400" />
                  Rs.{selectedOption.voucherAmount}
                </span>
              </div>

              <div className="border-t border-white/20 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-white">Total Amount:</span>
                  <span className="text-3xl font-bold text-emerald-400">Rs.{selectedOption.renewalPrice}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRenew}
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  {selectedOption.isUpgrade ? 'Upgrade Now' : 'Renew Now'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-gray-400 text-sm mt-4">
              Your membership will be extended for {selectedOption.maxEarningDays} days (up to {selectedOption.extendedEarningDays} days with referrals)
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
