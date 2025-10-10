'use client';

import React, { memo, useState } from 'react';
import { Users, Copy, Share2, Gift, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

interface ReferralSectionProps {
  stats: any;
  isDark: boolean;
}

export const ReferralSection: React.FC<ReferralSectionProps> = memo(({
  stats,
  isDark
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!stats) return null;

  const copyReferralCode = async () => {
    if (stats?.referralCode) {
      try {
        await navigator.clipboard.writeText(stats.referralCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy referral code:', err);
      }
    }
  };

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}/register?ref=${stats?.referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join MCNmart',
          text: 'Join MCNmart and start earning with my referral code!',
          url: referralLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(referralLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy referral link:', err);
      }
    }
  };

  const commissionLevels = [
    { level: 1, percentage: 20, color: 'bg-green-500', textColor: 'text-green-600' },
    { level: 2, percentage: 15, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { level: 3, percentage: 10, color: 'bg-purple-500', textColor: 'text-purple-600' },
    { level: 4, percentage: 8, color: 'bg-orange-500', textColor: 'text-orange-600' },
    { level: 5, percentage: 7, color: 'bg-red-500', textColor: 'text-red-600' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalCommissions = Object.values(stats.commissionBreakdown || {}).reduce((sum: number, val: number) => sum + val, 0);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border p-6 transition-colors ${
      isDark ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Referral Program
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Share and earn from your network
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-1"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>Details</span>
        </Button>
      </div>

      {/* Referral Code */}
      <div className="mb-6">
        <div className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
          isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium mb-1 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Your Referral Code
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                  {stats.referralCode || 'MCN000'}
                </Badge>
                {copySuccess && (
                  <span className="text-green-600 text-sm font-medium">
                    Copied!
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={copyReferralCode}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </Button>
              <Button
                onClick={shareReferralLink}
                size="sm"
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Breakdown */}
      <div className="mb-6">
        <h4 className={`font-semibold mb-3 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Commission Levels
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {commissionLevels.map((level) => (
            <div
              key={level.level}
              className={`p-3 rounded-lg text-center transition-colors ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${level.color}`}>
                <span className="text-white text-sm font-bold">{level.level}</span>
              </div>
              <div className={`text-sm font-bold ${level.textColor}`}>
                {level.percentage}%
              </div>
              <div className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Level {level.level}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings Summary */}
      <div className={`p-4 rounded-lg transition-colors ${
        isDark ? 'bg-gray-700' : 'bg-green-50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Total Commission Earned
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCommissions)}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Referrals
            </p>
            <p className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {stats.totalReferrals || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown (Collapsible) */}
      {showDetails && (
        <div className={`mt-6 p-4 rounded-lg border transition-colors ${
          isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
        }`}>
          <h4 className={`font-semibold mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Commission Breakdown
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.commissionBreakdown || {}).map(([level, amount]) => (
              <div key={level} className="flex justify-between items-center">
                <span className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Level {level.slice(-1)} Commission
                </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(amount as number)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ReferralSection.displayName = 'ReferralSection';
