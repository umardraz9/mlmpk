'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Target, Award, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useSession } from 'next-auth/react'
import TaskIframe from './TaskIframe'
import CountryBlockedMessage from './CountryBlockedMessage'

interface Task {
  id: string
  title: string
  description: string
  type: string
  category: string
  difficulty: string
  reward: number
  target: number
  timeLimit: number | null
  instructions: string | null
  icon: string
  color: string
  status: string
  articleUrl: string | null
  minDuration: number | null
  requireScrolling: boolean
  requireMouseMovement: boolean
  minScrollPercentage: number | null
  maxAttempts: number
  minAdClicks?: number | null
  userCompletion: any
  canStart: boolean
  isCompleted: boolean
  isInProgress: boolean
  progress: number
  requiresReferral: boolean
}

interface TaskListProps {
  initialTasks?: Task[]
}

export default function RealTimeTaskList({ initialTasks = [] }: TaskListProps) {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [assigningTasks, setAssigningTasks] = useState(false)
  const [userEligible, setUserEligible] = useState<boolean | null>(null)
  const [userCompletionsToday, setUserCompletionsToday] = useState<number>(0)
  const [userTasksPerDay, setUserTasksPerDay] = useState<number>(5)
  const [countryBlocked, setCountryBlocked] = useState<{
    isBlocked: boolean
    country?: string
    countryName?: string
    message?: string
  } | null>(null)

  // Debug activeTask changes
  useEffect(() => {
    console.log('🎯 activeTask changed:', activeTask ? {
      id: activeTask.id,
      title: activeTask.title,
      articleUrl: activeTask.articleUrl,
      type: activeTask.type
    } : null)
  }, [activeTask])

  // Assign daily tasks
  const assignDailyTasks = async () => {
    if (!session?.user) return

    setAssigningTasks(true)
    setError(null)

    try {
      console.log('📅 Assigning daily tasks...')
      const response = await fetch('/api/tasks/daily-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign daily tasks')
      }

      const data = await response.json()
      console.log('✅ Daily tasks assigned:', data.message)
      
      // Refresh task list to show new assignments
      await fetchTasks()
      
    } catch (err) {
      console.error('❌ Error assigning daily tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to assign daily tasks')
    } finally {
      setAssigningTasks(false)
    }
  }

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    if (!session?.user) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔄 Fetching tasks...')
      const response = await fetch('/api/tasks', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Check if this is a country blocking error
        if (response.status === 403 && errorData.code === 'REGION_BLOCKED') {
          setCountryBlocked({
            isBlocked: true,
            country: errorData.country,
            countryName: errorData.countryName,
            message: errorData.message
          })
          return
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Tasks fetched:', data.tasks?.length || 0)
      
      setTasks(data.tasks || [])
      if (data.userStats) {
        setUserEligible(!!data.userStats.eligible)
        setUserCompletionsToday(Number(data.userStats.completionsToday || 0))
        setUserTasksPerDay(Number(data.userStats.tasksPerDay || 5))
      }
      setLastUpdate(new Date())
    } catch (err) {
      console.error('❌ Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  // Set up Server-Sent Events for real-time updates
  useEffect(() => {
    if (!session?.user) return

    console.log('📡 Setting up SSE connection...')
    const eventSource = new EventSource('/api/tasks/events')

    eventSource.onopen = () => {
      console.log('✅ SSE connected')
      setConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 SSE message received:', data.type)

        switch (data.type) {
          case 'connected':
            console.log('🔗 SSE connection established')
            break
          
          case 'task_created':
            console.log('🆕 New task created:', data.data.title)
            // Refresh tasks to get the latest list
            fetchTasks()
            break
          
          case 'task_updated':
            console.log('📝 Task updated:', data.data.title)
            fetchTasks()
            break
          
          case 'heartbeat':
            // Keep connection alive
            break
          
          default:
            console.log('📨 Unknown SSE message type:', data.type)
        }
      } catch (err) {
        console.error('❌ Error parsing SSE message:', err)
      }
    }

    eventSource.onerror = (event) => {
      console.error('❌ SSE error:', event)
      setConnected(false)
      setError('Real-time connection lost')
    }

    // Cleanup on unmount
    return () => {
      console.log('🔌 Closing SSE connection')
      eventSource.close()
      setConnected(false)
    }
  }, [session?.user, fetchTasks])

  // Initial fetch
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Start a task
  const startTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    console.log('🚀 Starting task:', {
      id: task.id,
      title: task.title,
      type: task.type,
      articleUrl: task.articleUrl,
      hasArticleUrl: !!task.articleUrl,
      isContentEngagement: task.type === 'CONTENT_ENGAGEMENT'
    })

    try {
      // Always start task on server to create a completion record
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData?.error && typeof errorData.error === 'string') {
          setError(errorData.error)
          setAccessDenied(errorData.error.toLowerCase().includes('task access disabled'))
        }
        throw new Error(errorData.error || 'Failed to start task')
      }

      // If it has an article/video URL, open in iframe after starting
      if (task.articleUrl) {
        console.log('✅ Opening iframe for content task')
        setActiveTask(task)
      } else {
        console.log('❌ Not opening iframe:', {
          hasArticleUrl: !!task.articleUrl,
          taskType: task.type
        })
      }

      // Refresh tasks after starting to reflect in-progress state
      await fetchTasks()
    } catch (err) {
      console.error('❌ Error starting task:', err)
      const message = err instanceof Error ? err.message : 'Failed to start task'
      setError(message)
      setAccessDenied(message.toLowerCase().includes('task access disabled'))
    }
  }

  // Handle task completion from iframe
  const handleTaskComplete = async (taskId: string) => {
    setActiveTask(null)
    await fetchTasks()
  }

  // Close iframe
  const closeIframe = () => {
    setActiveTask(null)
  }

  // Complete a task (for simple tasks)
  const completeTask = async (taskId: string, task: Task) => {
    try {
      console.log(`🎯 Completing task ${taskId}`)
      
      // For simple tasks, just submit with basic completion
      const response = await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proofText: 'Task completed successfully',
          notes: 'Auto-completed simple task',
          metadata: {
            completedAt: new Date().toISOString(),
            taskType: task.type
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete task')
      }

      // Show success message
      if (result.autoApproved) {
        alert(`🎉 ${result.message}`)
      } else {
        alert(`📝 ${result.message}`)
      }

      // Refresh tasks
      await fetchTasks()
    } catch (err) {
      console.error('❌ Error completing task:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete task')
      alert('❌ ' + (err instanceof Error ? err.message : 'Failed to complete task'))
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (task: Task) => {
    if (task.isCompleted) return 'bg-green-100 text-green-800'
    if (task.isInProgress) return 'bg-blue-100 text-blue-800'
    if (task.canStart) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (task: Task) => {
    if (task.isCompleted) return 'Completed'
    if (task.isInProgress) return 'In Progress'
    if (task.canStart) return 'Available'
    if (task.requiresReferral) return 'Requires Referral'
    return 'Unavailable'
  }

  // Helper: detect if a task should be treated as a video
  const isVideoTask = (t: Task) => {
    const url = t.articleUrl || ''
    return t.type === 'VIDEO_WATCH' || /youtu\.be|youtube\.com|vimeo\.com/i.test(url)
  }

  if (!session?.user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Please log in to view tasks</p>
        </CardContent>
      </Card>
    )
  }

  // Show country blocked message if user is from blocked region
  if (countryBlocked?.isBlocked) {
    return (
      <CountryBlockedMessage
        country={countryBlocked.country}
        countryName={countryBlocked.countryName}
        message={countryBlocked.message}
        showAlternatives={true}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Connection Status & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {connected ? (
            <div className="flex items-center space-x-1 text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Real-time updates active</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Real-time updates disconnected</span>
            </div>
          )}

      {/* Referral Requirement Banner */}
      {userEligible === false && (
        <div className="rounded-xl p-4 border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">★</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 mb-1">Referral required to continue earning</p>
              <p className="text-sm text-amber-800 mb-3">
                Your initial 30-day earning period has ended. Add a qualifying referral to continue completing tasks.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/referrals" className="px-3 py-1.5 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700">Invite a Friend</Link>
                <Link href="/dashboard" className="px-3 py-1.5 text-sm rounded-md border">View Progress</Link>
                <Link href="/support" className="px-3 py-1.5 text-sm rounded-md border">Need Help?</Link>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            onClick={assignDailyTasks}
            disabled={assigningTasks}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            {assigningTasks ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-1" />
            )}
            {assigningTasks ? 'Assigning...' : 'Daily Tasks'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && !accessDenied && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Access Disabled Banner */}
      {accessDenied && (
        <div className="rounded-xl p-4 border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-rose-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">!</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800 mb-1">Task access disabled</p>
              <p className="text-sm text-red-700 mb-3">Please check your account status. You may need to activate your membership to start tasks.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/membership" className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Activate Membership</Link>
                <Link href="/dashboard" className="px-3 py-1.5 text-sm rounded-md border">Go to Dashboard</Link>
                <Link href="/support" className="px-3 py-1.5 text-sm rounded-md border">Contact Support</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && tasks.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Loading tasks...</p>
          </CardContent>
        </Card>
      )}

      {/* No Tasks State */}
      {!loading && tasks.length === 0 && !error && (
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks available</h3>
            <p className="text-gray-500 mb-4">
              New tasks will appear here automatically when they are created by administrators.
            </p>
            <Button onClick={fetchTasks} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check for new tasks
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{task.icon}</span>
                <div>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription>{task.description}</CardDescription>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <Badge className={getDifficultyColor(task.difficulty)}>
                  {task.difficulty}
                </Badge>
                <Badge className={getStatusColor(task)}>
                  {getStatusText(task)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-1">
                <Award className="h-4 w-4 text-green-600" />
                <span className="text-sm">PKR {Math.round(task.reward)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Target: {task.target}</span>
              </div>
              
              {task.timeLimit && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">{task.timeLimit}min</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium">{task.type.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {task.instructions && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{task.instructions}</p>
              </div>
            )}

            {task.articleUrl && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  {isVideoTask(task) ? '🎥 Video Watching Task' : '📖 Article Reading Task'} - Minimum {task.minDuration}s {isVideoTask(task) ? 'viewing' : 'reading'} time required
                  {task.minScrollPercentage ? ` • ${isVideoTask(task) ? 'Watch' : 'Scroll to'} ${task.minScrollPercentage}%` : ''}
                  {task.minAdClicks && task.minAdClicks > 0 ? ` • 🎯 Click at least ${task.minAdClicks} ad(s)` : ''}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Category: {task.category}
              </div>
              
              {/* Reward chip for quick visibility */}
              <div className="flex items-center mr-auto ml-4">
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Earn PKR {Math.round(task.reward)}
                </span>
              </div>
              
              {task.canStart && !task.isCompleted && !task.isInProgress && (
                <Button
                  onClick={() => startTask(task.id)}
                  className="bg-blue-600 hover:bg-blue-700 mr-2"
                >
                  {task.articleUrl
                    ? (isVideoTask(task)
                        ? `Open Video (PKR ${Math.round(task.reward)})`
                        : `Open Article (PKR ${Math.round(task.reward)})`)
                    : `Start Task (PKR ${Math.round(task.reward)})`}
                </Button>
              )}
              
              {task.isInProgress && ['DAILY', 'SIMPLE', 'BASIC'].includes(task.type) && (
                <Button
                  onClick={() => completeTask(task.id, task)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Task
                </Button>
              )}
              
              {/* Reopen content button for any in-progress task with an article/video URL */}
              {task.isInProgress && task.articleUrl && !activeTask && (
                <Button
                  onClick={() => startTask(task.id)}
                  className="bg-blue-600 hover:bg-blue-700 mr-2"
                >
                  Reopen {isVideoTask(task) ? 'Video' : 'Article'}
                </Button>
              )}
              
              {task.isInProgress && !['DAILY', 'SIMPLE', 'BASIC'].includes(task.type) && !task.articleUrl && (
                <Button variant="outline" disabled>
                  In Progress - Check requirements
                </Button>
              )}
              
              {task.isCompleted && (
                <Button variant="outline" disabled>
                  ✅ Completed
                </Button>
              )}
              
              {/* Show Requires Referral when user is gated */}
              {task.requiresReferral && !task.isCompleted && !task.canStart && (
                <Button variant="outline" disabled>
                  Requires Referral
                </Button>
              )}
              
              
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Task Iframe Modal */}
      {activeTask && activeTask.articleUrl && (
        <TaskIframe
          task={{
            id: activeTask.id,
            title: activeTask.title,
            articleUrl: activeTask.articleUrl,
            minDuration: activeTask.minDuration || 45,
            requireScrolling: activeTask.requireScrolling,
            minScrollPercentage: activeTask.minScrollPercentage || 70,
            reward: activeTask.reward,
            requireMouseMovement: activeTask.requireMouseMovement,
            minAdClicks: activeTask.minAdClicks || undefined
          }}
          onComplete={handleTaskComplete}
          onClose={closeIframe}
        />
      )}
    </div>
  )
}
