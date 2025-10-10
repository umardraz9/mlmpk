'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Lock, 
  Clock, 
  Eye, 
  MousePointer2, 
  Target,
  AlertTriangle,
  Info
} from 'lucide-react'
import { 
  getAvailableTasksForUser, 
  getNextAvailableTask, 
  isAdClickTask, 
  getTaskInstructions,
  contentTasks,
  type ContentTask 
} from '@/lib/content-tasks'

interface TaskListProps {
  completedTaskIds: string[]
  onTaskSelect: (task: ContentTask) => void
  currentUserId: string
}

export default function TaskList({ completedTaskIds, onTaskSelect, currentUserId }: TaskListProps) {
  const [availableTasks, setAvailableTasks] = useState<ContentTask[]>([])
  const [nextTask, setNextTask] = useState<ContentTask | null>(null)

  useEffect(() => {
    const available = getAvailableTasksForUser(completedTaskIds)
    const next = getNextAvailableTask(completedTaskIds)
    
    setAvailableTasks(available)
    setNextTask(next)
  }, [completedTaskIds])

  const getTaskStatus = (task: ContentTask): 'completed' | 'available' | 'locked' => {
    if (completedTaskIds.includes(task.id)) {
      return 'completed'
    }
    
    if (task.sequenceOrder === 1) {
      return 'available'
    }
    
    if (task.prerequisiteTaskId && completedTaskIds.includes(task.prerequisiteTaskId)) {
      return 'available'
    }
    
    return 'locked'
  }

  const getProgressPercentage = (): number => {
    return Math.round((completedTaskIds.length / contentTasks.length) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Task Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Completed Tasks</span>
              <span>{completedTaskIds.length} / {contentTasks.length}</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="text-sm text-muted-foreground">
              {nextTask ? (
                <span className="text-blue-600 font-medium">
                  Next: {nextTask.title}
                </span>
              ) : (
                <span className="text-green-600 font-medium">
                  🎉 All tasks completed!
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Info className="h-5 w-5" />
            How Tasks Work
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <ul className="space-y-2">
            <li>• Tasks unlock one by one - complete Task 1 to unlock Task 2</li>
            <li>• <strong>Tasks 1-4:</strong> Read-only tasks - just read the articles</li>
            <li>• <strong>Task 5:</strong> Special task - read article AND click on advertisements</li>
            <li>• Higher rewards for completing all requirements</li>
          </ul>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="grid gap-4">
        {contentTasks.map((task) => {
          const status = getTaskStatus(task)
          const isAdTask = isAdClickTask(task.id)
          const instructions = getTaskInstructions(task.id)
          
          return (
            <Card 
              key={task.id} 
              className={`transition-all duration-200 ${
                status === 'completed' 
                  ? 'border-green-200 bg-green-50' 
                  : status === 'available'
                  ? 'border-blue-200 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {status === 'locked' && (
                        <Lock className="h-5 w-5 text-gray-400" />
                      )}
                      {status === 'available' && (
                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {task.sequenceOrder}
                          </span>
                        </div>
                      )}
                      <span className={status === 'locked' ? 'text-gray-400' : ''}>
                        {task.title}
                      </span>
                    </CardTitle>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant={status === 'completed' ? 'default' : status === 'available' ? 'secondary' : 'outline'}
                        className={
                          status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : status === 'available'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-400'
                        }
                      >
                        PKR {task.reward}
                      </Badge>
                      
                      {isAdTask && (
                        <Badge variant="destructive" className="bg-orange-100 text-orange-700">
                          🎯 Ad Clicks Required
                        </Badge>
                      )}
                      
                      <Badge variant="outline" className={status === 'locked' ? 'text-gray-400' : ''}>
                        {task.timeRequirement} min
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className={`text-sm mb-4 ${status === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description}
                </p>
                
                {/* Task Requirements */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye className="h-3 w-3" />
                    <span>Scroll to {task.verificationRequirements.minScrollDepth * 100}% of article</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Spend at least {task.timeRequirement} minutes reading</span>
                  </div>
                  {task.verificationRequirements.mouseMovement && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MousePointer2 className="h-3 w-3" />
                      <span>Show active engagement (mouse movement)</span>
                    </div>
                  )}
                  {isAdTask && task.verificationRequirements.minAdClicks && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
                      <Target className="h-3 w-3" />
                      <span>Click on at least {task.verificationRequirements.minAdClicks} advertisements</span>
                    </div>
                  )}
                </div>

                {/* Special Instructions for Ad Tasks */}
                {isAdTask && status === 'available' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-orange-700 mb-1">Special Task Instructions:</p>
                        <p className="text-orange-600">{instructions.adInstructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prerequisite Info */}
                {status === 'locked' && task.prerequisiteTaskId && (
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Lock className="h-4 w-4" />
                      <span>
                        Complete "{contentTasks.find(t => t.id === task.prerequisiteTaskId)?.title}" first
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Action Button */}
                <Button 
                  onClick={() => onTaskSelect(task)}
                  disabled={status !== 'available'}
                  className={`w-full ${
                    status === 'completed' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : status === 'available'
                      ? isAdTask 
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400'
                  }`}
                >
                  {status === 'completed' && '✅ Completed'}
                  {status === 'available' && (isAdTask ? '🎯 Start Ad Task' : '📖 Start Reading')}
                  {status === 'locked' && '🔒 Locked'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
