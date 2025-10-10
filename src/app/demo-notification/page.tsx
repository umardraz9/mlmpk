'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import TaskSuccessNotification from '@/components/ui/TaskSuccessNotification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DemoNotificationPage() {
  const [showNotification, setShowNotification] = useState(false);

  const sampleTaskData = {
    timeSpent: '2:19',
    engagement: 100,
    reward: 10,
    bonusEarned: 5,
    streakCount: 3,
    levelUp: false
  };

  const sampleTaskDataWithLevelUp = {
    timeSpent: '3:45',
    engagement: 95,
    reward: 25,
    bonusEarned: 10,
    streakCount: 7,
    levelUp: true
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Upgraded Task Completion UI
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Modern, animated notification with enhanced user experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Before */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">❌ Before (Old UI)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-800 rounded-lg p-4 text-white text-sm font-mono">
                <div className="mb-2">127.0.0.1:55370 says</div>
                <div className="mb-2">⚠️ Congratulations!</div>
                <div className="mb-1">Task completed successfully!</div>
                <div className="mb-1">✅ Time spent: 2:19</div>
                <div className="mb-1">✅ Engagement: 100%</div>
                <div className="mb-1">💰 Reward earned: PKR 10</div>
                <div className="mb-4">Amount has been added to your account!</div>
                <button className="bg-blue-500 px-4 py-1 rounded text-sm">OK</button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                • Basic browser alert style
                • No animations or visual appeal
                • Poor mobile experience
                • Limited information display
              </div>
            </CardContent>
          </Card>

          {/* After */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ After (New UI)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">🏆</div>
                  <div className="font-bold text-green-600">Modern Modal Design</div>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>✨ Smooth animations & transitions</div>
                  <div>🎨 Beautiful gradient backgrounds</div>
                  <div>📱 Mobile-optimized responsive design</div>
                  <div>🎯 Enhanced visual hierarchy</div>
                  <div>🔥 Streak tracking & gamification</div>
                  <div>🎁 Bonus rewards display</div>
                  <div>⚡ Level up notifications</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Buttons */}
        <div className="text-center space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <Button
              onClick={() => setShowNotification(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-2xl"
            >
              🎯 Show Normal Completion
            </Button>
            
            <Button
              onClick={() => setShowNotification(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-2xl"
            >
              🚀 Show Level Up Version
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click the buttons above to see the upgraded notification in action
          </p>
        </div>

        {/* Features List */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🚀 New Features & Improvements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-600 mb-3">Visual Enhancements</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Modern glassmorphism design</li>
                  <li>• Smooth CSS animations</li>
                  <li>• Gradient backgrounds</li>
                  <li>• Interactive hover effects</li>
                  <li>• Responsive layout</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-3">User Experience</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Clear information hierarchy</li>
                  <li>• Gamification elements</li>
                  <li>• Multiple action buttons</li>
                  <li>• Streak tracking display</li>
                  <li>• Bonus rewards highlighting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* The upgraded notification component */}
      <TaskSuccessNotification
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        taskData={sampleTaskData}
      />
    </div>
  );
}
