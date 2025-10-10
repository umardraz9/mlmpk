'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Clock, 
  Eye, 
  MousePointer, 
  Scroll, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Info,
  X,
  Trophy,
  Coins,
  Sparkles,
  Star,
  Zap
} from 'lucide-react'

interface TaskExecutionProps {
  task: {
    id: string
    title: string
    description: string
    articleUrl: string
    minDuration: number
    requireScrolling: boolean
    requireMouseMovement: boolean
    minScrollPercentage: number
    reward: number
    maxAttempts: number
  }
  onComplete: (success: boolean, trackingData: any) => void
  onCancel: () => void
}

interface TrackingData {
  timeSpent: number
  scrollPercentage: number
  mouseMovements: number
  interactions: number
  startTime: number
  endTime: number
  adClicks: number
  isValid: boolean
}

export default function TaskExecution({ task, onComplete, onCancel }: TaskExecutionProps) {
  const [timeLeft, setTimeLeft] = useState(task.minDuration)
  const [isCompleted, setIsCompleted] = useState(false)
  const [canComplete, setCanComplete] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [timerStarted, setTimerStarted] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mouseMovements, setMouseMovements] = useState(0)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState({ reward: 0, newBalance: 0 })
  const [trackingData, setTrackingData] = useState<TrackingData>({
    timeSpent: 0,
    scrollPercentage: 0,
    mouseMovements: 0,
    interactions: 0,
    startTime: Date.now(),
    endTime: 0,
    adClicks: 0,
    isValid: false
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (timerStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1
          if (newTime <= 0) {
            setCanComplete(true)
            if (timerRef.current) {
              clearInterval(timerRef.current)
            }
            return 0
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timerStarted, timeLeft])

  // Simulate scroll and mouse tracking for iframe
  useEffect(() => {
    if (timerStarted) {
      const interval = setInterval(() => {
        // Simulate natural scroll progress
        setScrollProgress(prev => {
          const increment = Math.random() * 5 + 2
          return Math.min(prev + increment, 100)
        })
        
        // Simulate mouse movements
        setMouseMovements(prev => prev + Math.floor(Math.random() * 3) + 1)
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [timerStarted])

  const handleStartTask = () => {
    setShowInstructions(false)
    setTimerStarted(true)
    setTrackingData(prev => ({
      ...prev,
      startTime: Date.now()
    }))
  }

  const handleCompleteTask = async () => {
    if (!canComplete || isProcessing) return
    
    setIsProcessing(true)
    
    try {
      const finalTrackingData = {
        ...trackingData,
        timeSpent: task.minDuration - timeLeft,
        scrollPercentage: scrollProgress,
        mouseMovements: mouseMovements,
        endTime: Date.now(),
        isValid: canComplete && scrollProgress >= task.minScrollPercentage
      }

      console.log('Attempting to complete task:', {
        taskId: task.id,
        reward: task.reward,
        trackingData: finalTrackingData
      })

      // Add task completion to user account
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({
          taskId: task.id,
          reward: task.reward,
          trackingData: finalTrackingData
        })
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)

      if (response.ok && result.success) {
        setSuccessData({ reward: result.reward, newBalance: result.newBalance });
        setShowSuccess(true);
        // Redirect after showing success message
        setTimeout(() => {
          window.location.href = '/tasks';
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to complete task'}`)
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    onCancel()
  }

  const progressPercentage = ((task.minDuration - timeLeft) / task.minDuration) * 100

  return (
    <>
      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Task Instructions
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p className="text-sm">Read the article content carefully for at least {task.minDuration} seconds.</p>
            </div>
            {task.requireScrolling && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <p className="text-sm">Scroll through at least {task.minScrollPercentage}% of the article.</p>
              </div>
            )}
            {task.requireMouseMovement && (
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <p className="text-sm">Move your mouse naturally while reading to show engagement.</p>
              </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Reward:</strong> PKR {task.reward} upon successful completion
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleStartTask} className="flex-1">
              Start Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Execution Interface */}
      {!showInstructions && (
        <div className="flex flex-col h-screen">
          {/* Compact Progress Dashboard - Fixed at top, 10% of screen */}
          <div className="h-[10vh] min-h-[80px] bg-white border-b shadow-sm sticky top-0 z-10">
            <div className="h-full p-2 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-semibold truncate">{task.title}</h3>
                <Badge variant={canComplete ? "default" : "secondary"} className="text-xs">
                  {canComplete ? "Ready" : "In Progress"}
                </Badge>
              </div>
              
              {/* Compact Progress Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Timer */}
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="truncate">Time</span>
                      <span className="font-mono">{timeLeft}s</span>
                    </div>
                    <Progress value={progressPercentage} className="h-1" />
                  </div>
                </div>

                {/* Scroll Progress */}
                {task.requireScrolling && (
                  <div className="flex items-center space-x-2">
                    <Scroll className="w-3 h-3 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="truncate">Scroll</span>
                        <span className="font-mono">{Math.round(scrollProgress)}%</span>
                      </div>
                      <Progress value={scrollProgress} className="h-1" />
                    </div>
                  </div>
                )}

                {/* Mouse Activity */}
                {task.requireMouseMovement && (
                  <div className="flex items-center space-x-2">
                    <MousePointer className="w-3 h-3 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="truncate">Activity</span>
                        <span className="font-mono">{mouseMovements}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Article Content - Takes remaining 90% of screen */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-2 sm:p-4">
              <div className="h-full bg-gray-50 rounded-lg overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={task.articleUrl}
                  className="w-full h-full border-0"
                  title="Article Content"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </div>
            </div>
            
            {/* Fixed Action Buttons at bottom */}
            <div className="p-2 sm:p-4 bg-white border-t">
              <div className="flex gap-2 sm:gap-4 max-w-md mx-auto">
                <Button 
                  variant="outline" 
                  onClick={handleCancel} 
                  className="flex-1 text-xs sm:text-sm"
                  size="sm"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleCompleteTask}
                  disabled={!canComplete || isProcessing}
                  className="flex-1 text-xs sm:text-sm"
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : canComplete ? (
                    <>
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Complete Task (PKR {task.reward})
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Wait ({timeLeft}s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Success Modal */}
      {showSuccess && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-black/70 via-purple-900/20 to-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
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
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Enhanced Confetti & Sparkle Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(25)].map((_, i) => (
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
              
              {/* Floating Stars */}
              {[...Array(6)].map((_, i) => (
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

            {/* Enhanced Content Section */}
            <div className="p-8 space-y-6">
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
                    +PKR {successData.reward}
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-700/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-600/20"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">New Balance:</span>
                      <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        PKR {successData.newBalance}
                      </span>
                    </div>
                  </motion.div>
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
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5 }}
                  className="text-sm text-gray-500 dark:text-gray-400 mb-4"
                >
                  Redirecting to tasks page in 3 seconds...
                </motion.div>
              </motion.div>

              {/* Premium Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="pt-4"
              >
                <Button
                  onClick={() => window.location.href = '/tasks'}
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
      )}
    </>
  )
}
