'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import TaskList from '@/components/TaskList'
import TaskExecution from '@/components/TaskExecution'
import { contentTasks, type ContentTask } from '@/lib/content-tasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function TaskDemo() {
  const { data: session } = useSession()
  const [executingTask, setExecutingTask] = useState<any>(null)
  const [completedContentTasks, setCompletedContentTasks] = useState<string[]>([])

  const handleTaskComplete = (taskId: string) => {
    setCompletedContentTasks(prev => [...prev, taskId])
    setExecutingTask(null)
  }

  const handleTaskSelect = (task: ContentTask) => {
    // Convert ContentTask to the format expected by TaskExecution
    const executionTask = {
      ...task,
      id: task.id,
      title: task.title,
      description: task.description,
      articleUrl: task.articleUrl,
      minDuration: task.minDuration || 45,
      requireScrolling: task.requireScrolling !== false,
      requireMouseMovement: task.requireMouseMovement !== false,
      minScrollPercentage: task.minScrollPercentage || 70,
      maxAttempts: task.maxAttempts || 3
    }
    setExecutingTask(executionTask)
  }

  if (executingTask) {
    return (
      <TaskExecution
        task={executingTask}
        onComplete={() => handleTaskComplete(executingTask.id)}
        onCancel={() => setExecutingTask(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Tasks
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Sequential Task System Demo</h1>
          </div>
          <p className="text-gray-600">
            Experience the new sequential task workflow with progress tracking and ad-click requirements
          </p>
        </div>

        {/* Demo Controls */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              🎮 Demo Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCompletedContentTasks([])}
              >
                Reset All Tasks
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCompletedContentTasks(['task-1'])}
              >
                Complete Task 1
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCompletedContentTasks(['task-1', 'task-2'])}
              >
                Complete Tasks 1-2
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setCompletedContentTasks(['task-1', 'task-2', 'task-3', 'task-4'])}
              >
                Complete Tasks 1-4 (Unlock Ad Task)
              </Button>
            </div>
            <p className="text-sm text-blue-600">
              Use these buttons to simulate different completion states and see how tasks unlock sequentially
            </p>
          </CardContent>
        </Card>

        {/* Sequential Task List */}
        <TaskList 
          completedTaskIds={completedContentTasks}
          onTaskSelect={handleTaskSelect}
          currentUserId={session?.user?.id || 'demo-user'}
        />
      </div>
    </div>
  )
}
