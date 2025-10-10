'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Calendar, CheckSquare, Square, Eye, SlidersHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Task {
  id: string
  title: string
  type: string
  reward: number
}

export default function AdminTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [dateFilter, setDateFilter] = useState('all')
  const [filteredTasks, setFilteredTasks] = useState<any[]>([])
  const [loadError, setLoadError] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    reward: 50,
    difficulty: 'MEDIUM',
    category: 'general',
    description: '',
    instructions: '',
    articleUrl: '',
    minDuration: 45,
    minScrollPercentage: 70,
    maxAttempts: 3,
    minAdClicks: 0
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      type: '',
      reward: 50,
      difficulty: 'MEDIUM',
      category: 'general',
      description: '',
      instructions: '',
      articleUrl: '',
      minDuration: 45,
      minScrollPercentage: 70,
      maxAttempts: 3,
      minAdClicks: 0
    })
    setEditingTask(null)
  }

  const handleEditTask = (task: any) => {
    setFormData((prev) => ({
      ...prev,
      title: task.title || prev.title || '',
      type: task.type || prev.type || '',
      reward: typeof task.reward === 'number' ? task.reward : prev.reward,
      difficulty: task.difficulty || prev.difficulty,
      category: task.category || prev.category,
      description: task.description ?? prev.description,
      instructions: task.instructions ?? prev.instructions,
      articleUrl: task.articleUrl || '',
      minDuration: typeof task.minDuration === 'number' ? task.minDuration : prev.minDuration,
      minScrollPercentage: typeof task.minScrollPercentage === 'number' ? task.minScrollPercentage : prev.minScrollPercentage,
      maxAttempts: typeof task.maxAttempts === 'number' ? task.maxAttempts : prev.maxAttempts,
      minAdClicks: typeof task.minAdClicks === 'number' ? task.minAdClicks : prev.minAdClicks,
    }))
    setEditingTask(task)
    setShowCreateDialog(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    console.log('🗑️ Delete button clicked for task:', taskId)
    
    if (!taskId) {
      console.error('❌ No task ID provided')
      alert('Error: No task ID provided')
      return
    }
    
    // Test session first
    try {
      console.log('🔐 Testing session...')
      const sessionResponse = await fetch('/api/auth/session')
      const sessionData = await sessionResponse.json()
      console.log('👤 Session data:', sessionData)
      
      if (!sessionData?.user?.isAdmin) {
        console.error('❌ User is not admin or not logged in')
        alert('Error: You must be logged in as an admin to delete tasks')
        return
      }
    } catch (error) {
      console.error('💥 Session check failed:', error)
      alert('Error: Could not verify admin status')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        console.log('🔄 Starting delete request for task:', taskId)
        console.log('🌐 API URL:', `/api/admin/tasks/${taskId}`)
        
        const response = await fetch(`/api/admin/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        console.log('📡 Response status:', response.status)
        console.log('📡 Response ok:', response.ok)
        
        if (!response.ok) {
          console.error('❌ Response not ok:', response.status, response.statusText)
        }
        
        const result = await response.json()
        console.log('📋 Delete response data:', result)
        
        if (response.ok) {
          console.log('✅ Task deleted successfully')
          
          // Immediately remove task from UI before API refresh
          setTasks(prevTasks => {
            const updatedTasks = prevTasks.filter(t => t.id !== taskId)
            console.log('🗑️ Removed task from UI, remaining:', updatedTasks.length)
            return updatedTasks
          })
          
          alert(result.message || 'Task deleted successfully!')
          
          // Also refresh from API to ensure consistency
          await fetchTasks()
        } else {
          console.error('❌ Delete failed:', result)
          alert(`Failed to delete task: ${result.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('💥 Network/Parse error deleting task:', error)
        alert(`Network error occurred: ${error.message}`)
      }
    } else {
      console.log('🚫 Delete cancelled by user')
    }
  }

  const handleBulkDelete = async () => {
    console.log('🗑️ Bulk delete button clicked')
    console.log('📋 Selected tasks:', Array.from(selectedTasks))
    
    if (selectedTasks.size === 0) {
      console.log('❌ No tasks selected')
      alert('Please select tasks to delete')
      return
    }

    if (window.confirm(`Are you sure you want to delete ${selectedTasks.size} selected task(s)?`)) {
      console.log('✅ User confirmed bulk delete')
      setBulkDeleting(true)
      let successCount = 0
      let errorCount = 0
      
      try {
        console.log('Bulk deleting tasks:', Array.from(selectedTasks))
        
        // Delete tasks one by one to handle errors properly
        for (const taskId of selectedTasks) {
          try {
            const response = await fetch(`/api/admin/tasks/${taskId}`, { 
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              }
            })
            
            if (response.ok) {
              successCount++
              console.log(`Successfully deleted task: ${taskId}`)
            } else {
              errorCount++
              const error = await response.json()
              console.error(`Failed to delete task ${taskId}:`, error)
            }
          } catch (error) {
            errorCount++
            console.error(`Network error deleting task ${taskId}:`, error)
          }
        }
        
        // Immediately remove successfully deleted tasks from UI
        if (successCount > 0) {
          setTasks(prevTasks => {
            const updatedTasks = prevTasks.filter(task => !selectedTasks.has(task.id))
            console.log(`🗑️ Removed ${successCount} tasks from UI, remaining:`, updatedTasks.length)
            return updatedTasks
          })
        }
        
        // Show results
        if (successCount > 0 && errorCount === 0) {
          alert(`Successfully deleted ${successCount} task(s)!`)
        } else if (successCount > 0 && errorCount > 0) {
          alert(`Deleted ${successCount} task(s), but ${errorCount} failed. Check console for details.`)
        } else {
          alert(`Failed to delete all ${errorCount} task(s). Check console for details.`)
        }
        
        setSelectedTasks(new Set())
        
        // Refresh from API to ensure consistency
        await fetchTasks()
      } catch (error) {
        console.error('Error in bulk delete operation:', error)
        alert('Unexpected error during bulk delete operation')
      } finally {
        setBulkDeleting(false)
      }
    }
  }

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)))
    }
  }

  const filterTasksByDate = (tasks: any[], filter: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt)
      
      switch (filter) {
        case 'today':
          return taskDate >= today
        case 'yesterday':
          return taskDate >= yesterday && taskDate < today
        case 'week':
          return taskDate >= thisWeek
        case 'month':
          return taskDate >= thisMonth
        default:
          return true
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingTask ? `/api/admin/tasks/${editingTask.id}` : '/api/admin/tasks'
      const method = editingTask ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const taskData = await response.json()
        setShowCreateDialog(false)
        resetForm()
        setEditingTask(null)
        alert(editingTask ? 'Task updated successfully!' : 'Task created successfully!')
        fetchTasks() // Refresh the list
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving task:', error)
      alert('Error saving task')
    } finally {
      setSubmitting(false)
    }
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      console.log('🔄 Fetching tasks from API...')
      // Add cache busting to ensure fresh data
      const response = await fetch(`/api/admin/tasks?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      console.log('📡 Fetch response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Fetched tasks data:', data)
        console.log('📊 Number of tasks received:', data.tasks?.length || 0)
        
        setTasks(data.tasks || [])
        
        // Force re-render by updating state
        setTimeout(() => {
          console.log('🔄 Tasks state updated')
        }, 100)
      } else {
        console.error('❌ Failed to fetch tasks:', response.status, response.statusText)
        try {
          const err = await response.json()
          console.log('❌ Error body:', err)
          setLoadError(err?.error || `Failed to fetch tasks (${response.status})`)
        } catch (_) {
          setLoadError(`Failed to fetch tasks (${response.status})`)
        }
        if (response.status === 401) {
          // Redirect admin to login and preserve return path
          setTimeout(() => router.push('/auth/login?callbackUrl=/admin/tasks'), 10)
        }
      }
    } catch (error) {
      console.error('💥 Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter tasks when tasks or dateFilter changes
  useEffect(() => {
    const filtered = filterTasksByDate(tasks, dateFilter)
    setFilteredTasks(filtered)
    // Clear selections when filter changes
    setSelectedTasks(new Set())
  }, [tasks, dateFilter])

  const createDemoTasks = async () => {
    const demoTasks = [
      {
        title: 'Read Technology Article',
        type: '📖 Article Reading Task',
        articleUrl: `${window.location.origin}/content/tech-article`,
        minDuration: 60,
        minScrollPercentage: 80,
        maxAttempts: 3,
        minAdClicks: 0
      },
      {
        title: 'Read Business Article with Ad Clicks',
        type: '📖 Article Reading Task',
        articleUrl: `${window.location.origin}/content/business-article`,
        minDuration: 90,
        minScrollPercentage: 75,
        maxAttempts: 2,
        minAdClicks: 2
      },
      {
        title: 'Complete Daily Survey',
        type: 'DAILY',
        articleUrl: '',
        minDuration: 30,
        minScrollPercentage: 50,
        maxAttempts: 1,
        minAdClicks: 0
      }
    ]

    for (const task of demoTasks) {
      try {
        const response = await fetch('/api/admin/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task),
        })
        
        if (response.ok) {
          console.log(`Created demo task: ${task.title}`)
        }
      } catch (error) {
        console.error('Error creating demo task:', error)
      }
    }
    
    // Refresh tasks list after creating demos
    fetchTasks()
  }

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Create and manage tasks with rewards</p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={() => router.push('/admin/task-controls')}
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Task Controls
          </Button>

          <Button 
            onClick={() => router.push('/admin/tasks/submissions')}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Review Submissions
          </Button>
          
          {/* Test Button */}
          <Button 
            onClick={() => {
              console.log('🧪 TEST BUTTON CLICKED - JavaScript is working!')
              alert('Test button works! JavaScript is functioning.')
            }}
            variant="outline"
            className="mr-2"
          >
            🧪 Test Click
          </Button>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="text-center pb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {editingTask ? '✏️ Edit Task' : '✨ Create New Task'}
              </DialogTitle>
              <p className="text-gray-600 mt-2">
                {editingTask ? 'Update task details and settings' : 'Design engaging tasks with rewards for your users'}
              </p>
            </DialogHeader>
            
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Basic Information Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  📝 Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Enter task title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Task Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">📅 Daily Task</SelectItem>
                      <SelectItem value="SIMPLE">⚡ Simple Task</SelectItem>
                      <SelectItem value="BASIC">📋 Basic Task</SelectItem>
                      <SelectItem value="SOCIAL_MEDIA">📱 Social Media Task</SelectItem>
                      <SelectItem value="SURVEY">📊 Survey Task</SelectItem>
                      <SelectItem value="CONTENT_CREATION">✍️ Content Creation</SelectItem>
                      <SelectItem value="CONTENT_ENGAGEMENT">📖 Article Reading Task</SelectItem>
                      <SelectItem value="VIDEO_WATCH">🎥 Video Watching Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reward">Reward Amount (PKR)</Label>
                  <Input
                    id="reward"
                    type="text"
                    value={"Plan-based (auto)"}
                    disabled
                    placeholder="Calculated by membership plan"
                  />
                  <p className="text-xs text-gray-500">
                    Rewards are calculated automatically from the user\'s membership plan: dailyTaskEarning ÷ tasksPerDay (default 5).
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => handleChange('difficulty', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">🐰 Easy</SelectItem>
                      <SelectItem value="MEDIUM">💯 Medium</SelectItem>
                      <SelectItem value="HARD">🔥 Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Task Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe what users need to do..."
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Input
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => handleChange('instructions', e.target.value)}
                    placeholder="Detailed step-by-step instructions..."
                  />
                </div>
              </div>
            </div>

              {(formData.type === 'CONTENT_ENGAGEMENT' || formData.type === 'VIDEO_WATCH') && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-orange-800 mb-6 flex items-center">
                    {formData.type === 'CONTENT_ENGAGEMENT' ? '📖 Article' : '🎥 Video'} & Tracking Settings
                    <span className="ml-2 text-sm text-orange-600 font-normal">Configure {formData.type === 'CONTENT_ENGAGEMENT' ? 'reading' : 'viewing'} requirements</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="articleUrl">📄 {formData.type === 'CONTENT_ENGAGEMENT' ? 'Article' : 'Video'} URL *</Label>
                      <Input
                        id="articleUrl"
                        value={formData.articleUrl}
                        onChange={(e) => handleChange('articleUrl', e.target.value)}
                        placeholder={formData.type === 'CONTENT_ENGAGEMENT' ? 'https://example.com/article or any website article' : 'https://youtube.com/watch?v=...'}
                      />
                      {formData.type === 'CONTENT_ENGAGEMENT' && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-2">
                            💡 You can add any website article URL (news sites, blogs, educational content, etc.)
                          </p>
                          <details className="text-xs text-gray-600">
                            <summary className="cursor-pointer hover:text-blue-600">Example Article URLs</summary>
                            <div className="mt-1 space-y-1 pl-4">
                              <div>• https://www.bbc.com/news/business-...</div>
                              <div>• https://www.dawn.com/news/...</div>
                              <div>• https://blog.hubspot.com/marketing/...</div>
                              <div>• https://medium.com/@author/article-title</div>
                              <div>• https://www.wikipedia.org/wiki/...</div>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="minDuration">⏱️ Min Duration (seconds)</Label>
                      <Input
                        id="minDuration"
                        type="number"
                        value={formData.minDuration}
                        onChange={(e) => handleChange('minDuration', parseInt(e.target.value) || 45)}
                        min="30"
                        max="300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="minScrollPercentage">📜 Min Scroll %</Label>
                      <Input
                        id="minScrollPercentage"
                        type="number"
                        value={formData.minScrollPercentage}
                        onChange={(e) => handleChange('minScrollPercentage', parseInt(e.target.value) || 70)}
                        min="10"
                        max="100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxAttempts">🎯 Max Attempts</Label>
                      <Input
                        id="maxAttempts"
                        type="number"
                        value={formData.maxAttempts}
                        onChange={(e) => handleChange('maxAttempts', parseInt(e.target.value) || 3)}
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="mt-6 p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl shadow-sm">
                    <h4 className="font-semibold text-yellow-800 mb-4 flex items-center">
                      🎯 Ad Click Requirements
                      <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Optional</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Task Sub-Type</Label>
                        <Select 
                          value={formData.minAdClicks > 0 ? 'read-and-click-ads' : 'read-only'} 
                          onValueChange={(value) => {
                            if (value === 'read-and-click-ads') {
                              handleChange('minAdClicks', 2)
                            } else {
                              handleChange('minAdClicks', 0)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="read-only">📖 Read-Only Task</SelectItem>
                            <SelectItem value="read-and-click-ads">🎯 Read + Ad Click Task</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="minAdClicks">Min Ad Clicks Required</Label>
                        <Input
                          id="minAdClicks"
                          type="number"
                          value={formData.minAdClicks}
                          onChange={(e) => handleChange('minAdClicks', parseInt(e.target.value) || 0)}
                          min="0"
                          max="5"
                        />
                      </div>
                    </div>
                    
                    {formData.minAdClicks > 0 && (
                      <div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
                        <strong>🎯 Ad Click Task:</strong> Users must click on {formData.minAdClicks} advertisement(s) 
                        in addition to reading the article.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setShowCreateDialog(false)}
                  className="px-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-8 shadow-lg flex items-center"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {editingTask 
                    ? (submitting ? 'Updating...' : '✏️ Update Task')
                    : (submitting ? 'Creating...' : '✨ Create Task')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
            <div className="flex items-center space-x-4">
              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Bulk Actions */}
              {selectedTasks.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedTasks.size} selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleBulkDelete()
                    }}
                    disabled={bulkDeleting}
                    className="flex items-center space-x-1"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{bulkDeleting ? 'Deleting...' : 'Delete Selected'}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Select All Checkbox */}
          {filteredTasks.length > 0 && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="flex items-center space-x-2 h-8 px-2"
              >
                {selectedTasks.size === filteredTasks.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {selectedTasks.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
                </span>
              </Button>
              <span className="text-sm text-gray-500">
                ({filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading tasks...</div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {dateFilter === 'all' 
                ? 'No tasks found. Create your first task to get started!'
                : `No tasks found for ${dateFilter === 'today' ? 'today' : dateFilter === 'yesterday' ? 'yesterday' : dateFilter === 'week' ? 'this week' : 'this month'}.`
              }
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const isSelected = selectedTasks.has(task.id)
                const taskDate = new Date(task.createdAt).toLocaleDateString()
                
                return (
                  <div 
                    key={task.id} 
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-300 bg-blue-50 shadow-md' 
                        : 'hover:shadow-md hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Selection Checkbox */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTaskSelection(task.id)}
                        className="p-1 h-8 w-8 mt-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      
                      {/* Task Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">Type: {task.type}</p>
                        <p className="text-green-600 font-medium mt-1">Reward: PKR {task.reward}</p>
                        <p className="text-gray-500 text-xs mt-1">Created: {taskDate}</p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('✏️ Edit button clicked for task:', task.id)
                            handleEditTask(task)
                          }}
                          type="button"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('🎯 Delete button clicked for task:', task)
                            console.log('🆔 Task ID:', task.id)
                            console.log('🔍 Task ID type:', typeof task.id)
                            handleDeleteTask(task.id)
                          }}
                          type="button"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
