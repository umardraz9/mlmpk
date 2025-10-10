'use client';

import React, { useState } from 'react';
import { TaskCompletionModal } from '@/components/ui/TaskCompletionModal';
import { Button } from '@/components/ui/button';

export default function TestModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sampleTaskData = {
    timeSpent: '0:53',
    engagement: 100,
    reward: 30,
    bonusEarned: 10,
    streakCount: 5,
    levelUp: true
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Task Completion Modal Test
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Click the button below to see the updated premium modal design
        </p>
        
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          Show Task Completion Modal
        </Button>

        <div className="mt-8 p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/20 dark:border-gray-700/20 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Modal Features:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 text-left">
            <li>✨ Premium glassmorphism design</li>
            <li>🎊 Enhanced confetti and star animations</li>
            <li>🎨 Modern gradient color schemes</li>
            <li>📱 Responsive and mobile-friendly</li>
            <li>🌙 Dark mode support</li>
            <li>⚡ Smooth spring animations</li>
            <li>🏆 Level up celebrations</li>
            <li>💰 Reward display with currency formatting</li>
          </ul>
        </div>
      </div>

      <TaskCompletionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskData={sampleTaskData}
      />
    </div>
  );
}
