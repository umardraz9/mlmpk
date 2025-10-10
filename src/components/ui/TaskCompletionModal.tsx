'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Coins,
  X,
  Sparkles,
  Trophy,
  Gift,
  Star,
  Zap,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskData: {
    timeSpent: string;
    engagement: number;
    reward: number;
    bonusEarned?: number;
    streakCount?: number;
    levelUp?: boolean;
  };
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  isOpen,
  onClose,
  taskData
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Enhanced Backdrop with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-black/70 via-purple-900/20 to-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Premium Modal Container */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 50, rotateX: -15 }}
              animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 50, rotateX: -15 }}
              transition={{ 
                type: "spring", 
                duration: 0.6,
                bounce: 0.3
              }}
              className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Enhanced Confetti & Sparkle Effects */}
              {showConfetti && (
                <>
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                      <motion.div
                        key={`confetti-${i}`}
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                          background: `linear-gradient(45deg, ${
                            ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6]
                          }, ${
                            ['#FFA726', '#EF5350', '#26C6DA', '#42A5F5', '#66BB6A', '#FFCC02'][i % 6]
                          })`
                        }}
                        initial={{
                          x: Math.random() * 500,
                          y: -20,
                          rotate: 0,
                          scale: 0
                        }}
                        animate={{
                          y: 600,
                          rotate: 720,
                          scale: [0, 1.2, 0.8, 0]
                        }}
                        transition={{
                          duration: 4,
                          delay: Math.random() * 2,
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Floating Stars */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={`star-${i}`}
                        className="absolute"
                        initial={{
                          x: Math.random() * 400,
                          y: Math.random() * 300,
                          scale: 0,
                          rotate: 0
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          rotate: 360,
                          y: [null, Math.random() * 100 - 50]
                        }}
                        transition={{
                          duration: 3,
                          delay: Math.random() * 1.5,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* Premium Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 backdrop-blur-sm transition-all duration-200 hover:scale-110 z-20 group"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white transition-colors" />
              </button>

              {/* Premium Header with Enhanced Gradients */}
              <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-10 text-center overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>
                
                {/* Animated Success Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.2, 
                    type: "spring",
                    bounce: 0.6,
                    duration: 0.8
                  }}
                  className="relative inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6 shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-full animate-pulse"></div>
                  <Trophy className="w-12 h-12 text-white relative z-10" />
                  
                  {/* Crown for Level Up */}
                  {taskData.levelUp && (
                    <motion.div
                      initial={{ scale: 0, y: -10 }}
                      animate={{ scale: 1, y: -8 }}
                      transition={{ delay: 0.8, type: "spring" }}
                      className="absolute -top-2 -right-1"
                    >
                      <Crown className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                    </motion.div>
                  )}
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-bold text-white mb-3 tracking-tight"
                >
                  <span className="inline-block mr-2">🎉</span>
                  Outstanding!
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/95 text-lg font-medium"
                >
                  Task completed successfully!
                </motion.p>

                {/* Level Up Badge */}
                {taskData.levelUp && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.6, type: "spring", bounce: 0.5 }}
                    className="absolute -top-3 -right-3"
                  >
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 py-1.5 text-sm font-bold shadow-lg">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Level Up!
                    </Badge>
                  </motion.div>
                )}

                {/* Floating Zap Icons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="absolute top-4 left-4"
                >
                  <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="absolute bottom-4 right-8"
                >
                  <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                </motion.div>
              </div>

              {/* Enhanced Stats Section */}
              <div className="p-8 space-y-6">
                {/* Premium Stats Grid */}
                <div className="grid grid-cols-2 gap-5">
                  <motion.div
                    initial={{ opacity: 0, x: -30, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", bounce: 0.4 }}
                    className="relative bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-blue-200/20 dark:border-blue-400/20 hover:scale-105 transition-transform duration-200 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl group-hover:from-blue-500/10 transition-colors duration-200"></div>
                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl mb-3 shadow-lg">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Time Spent</p>
                      <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {taskData.timeSpent}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 30, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.7, type: "spring", bounce: 0.4 }}
                    className="relative bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/10 backdrop-blur-sm rounded-2xl p-5 text-center border border-purple-200/20 dark:border-purple-400/20 hover:scale-105 transition-transform duration-200 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl group-hover:from-purple-500/10 transition-colors duration-200"></div>
                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mb-3 shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Engagement</p>
                      <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {taskData.engagement}%
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Premium Reward Section */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", bounce: 0.3 }}
                  className="relative bg-gradient-to-br from-emerald-500/10 via-green-400/5 to-teal-500/10 dark:from-emerald-400/20 dark:to-teal-400/10 backdrop-blur-sm rounded-3xl p-8 text-center border border-emerald-200/20 dark:border-emerald-400/20 overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
                >
                  {/* Background Effects */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-400/10 to-teal-500/10 rounded-full translate-y-12 -translate-x-12"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent group-hover:from-emerald-500/10 transition-colors duration-300"></div>
                  
                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 1, type: "spring", bounce: 0.5 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-4 shadow-xl"
                    >
                      <Coins className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Reward Earned</p>
                    <motion.p
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.1, type: "spring" }}
                      className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-4"
                    >
                      {formatCurrency(taskData.reward)}
                    </motion.p>
                    
                    {taskData.bonusEarned && (
                      <motion.div
                        initial={{ scale: 0, y: 10 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: 1.2, type: "spring" }}
                      >
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-4 py-2 text-sm font-bold shadow-lg">
                          <Gift className="w-4 h-4 mr-1.5" />
                          +{formatCurrency(taskData.bonusEarned)} Bonus
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Enhanced Success Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  className="text-center space-y-3"
                >
                  <div className="flex items-center justify-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.4, type: "spring", bounce: 0.6 }}
                      className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mr-3 shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-white" />
                    </motion.div>
                    <span className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Amount has been added to your account!
                    </span>
                  </div>
                  
                  {taskData.streakCount && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.5 }}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full"
                    >
                      <span className="text-2xl mr-2">🔥</span>
                      <span className="font-semibold text-orange-700 dark:text-orange-300">
                        {taskData.streakCount} day streak! Keep it up!
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Premium Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 }}
                  className="pt-6"
                >
                  <Button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg text-lg relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center justify-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Continue Earning
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskCompletionModal;
