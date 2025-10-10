'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Coins,
  X,
  Trophy,
  Gift,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TaskSuccessNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  taskData?: {
    timeSpent?: string;
    engagement?: number;
    reward?: number;
    bonusEarned?: number;
    streakCount?: number;
    levelUp?: boolean;
  };
}

export const TaskSuccessNotification: React.FC<TaskSuccessNotificationProps> = ({
  isOpen,
  onClose,
  taskData = {
    timeSpent: '2:19',
    engagement: 100,
    reward: 10,
    bonusEarned: 5,
    streakCount: 3,
    levelUp: false
  }
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-500">
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-green-400/20 to-blue-500/20 rounded-full animate-pulse delay-1000"></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 z-10 hover:scale-110"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4 animate-bounce">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 animate-in slide-in-from-top-2 duration-700">
            🎉 Congratulations!
          </h2>
          
          <p className="text-white/90 text-lg animate-in slide-in-from-top-4 duration-700 delay-100">
            Task completed successfully!
          </p>

          {taskData.levelUp && (
            <div className="absolute -top-2 -right-2 animate-in spin-in-180 duration-1000 delay-500">
              <Badge className="bg-yellow-500 text-yellow-900 border-yellow-400 shadow-lg">
                <Sparkles className="w-3 h-3 mr-1" />
                Level Up!
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 text-center transform hover:scale-105 transition-transform duration-200 animate-in slide-in-from-left duration-700 delay-200">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Time Spent</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {taskData.timeSpent}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-4 text-center transform hover:scale-105 transition-transform duration-200 animate-in slide-in-from-right duration-700 delay-300">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Engagement</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {taskData.engagement}%
              </p>
            </div>
          </div>

          {/* Reward Section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 rounded-2xl p-6 text-center relative overflow-hidden animate-in slide-in-from-bottom duration-700 delay-400">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full -translate-y-10 translate-x-10 animate-pulse"></div>
            
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">💰 Reward Earned</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-3">
              {formatCurrency(taskData.reward || 0)}
            </p>
            
            {taskData.bonusEarned && (
              <Badge className="bg-yellow-500 text-yellow-900 shadow-lg animate-pulse">
                <Gift className="w-3 h-3 mr-1" />
                +{formatCurrency(taskData.bonusEarned)} Bonus
              </Badge>
            )}
          </div>

          {/* Success Message */}
          <div className="text-center space-y-3 animate-in slide-in-from-bottom duration-700 delay-500">
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 animate-pulse">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-green-600 dark:text-green-400 font-semibold">
                Amount has been added to your account!
              </span>
            </div>
            
            {taskData.streakCount && (
              <div className="inline-flex items-center bg-orange-100 dark:bg-orange-900/20 px-4 py-2 rounded-full">
                <span className="text-2xl mr-2">🔥</span>
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  {taskData.streakCount} day streak! Keep it up!
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 animate-in slide-in-from-bottom duration-700 delay-600">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-2xl border-2 hover:scale-105 transition-transform duration-200"
            >
              View Dashboard
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-2xl hover:scale-105 transition-transform duration-200 shadow-lg"
            >
              Continue Earning
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskSuccessNotification;
