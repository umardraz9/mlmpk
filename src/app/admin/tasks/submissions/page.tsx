'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Award, 
  RefreshCw,
  Eye
} from 'lucide-react'

interface TaskSubmission {
  id: string
  status: string
  progress: number
  reward: number
  notes: string | null
  trackingData: any
  createdAt: string
  completedAt: string | null
  timeAgo: string
  user: {
    id: string
    name: string
    email: string
    referralCode: string
  }
  task: {
    id: string
    title: string
    type: string
    category: string
    reward: number
    difficulty: string
  }
}

export default function TaskSubmissionsPage() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('PENDING')
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    rejected: 0,
    inProgress: 0
  })
  const [processing, setProcessing] = useState<string | null>(null)

  // Fetch submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/tasks/submissions?status=${status}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      alert('Failed to fetch task submissions')
    } finally {
      setLoading(false)
    }
  }

  // Handle approval/rejection
  const handleSubmission = async (submissionId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      setProcessing(submissionId)
      
      const response = await fetch(`/api/admin/tasks/submissions/${submissionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, notes })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process submission')
      }

      alert(result.message)
      fetchSubmissions() // Refresh list
    } catch (error) {
      console.error('Error processing submission:', error)
      alert(error instanceof Error ? error.message : 'Failed to process submission')
    } finally {
      setProcessing(null)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [status])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Submissions</h1>
          <p className="text-gray-600">Review and approve user task submissions</p>
        </div>
        <Button onClick={fetchSubmissions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`cursor-pointer hover:shadow-md ${status === 'PENDING' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => setStatus('PENDING')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:shadow-md ${status === 'COMPLETED' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setStatus('COMPLETED')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:shadow-md ${status === 'REJECTED' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setStatus('REJECTED')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:shadow-md ${status === 'IN_PROGRESS' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setStatus('IN_PROGRESS')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading submissions...</p>
            </CardContent>
          </Card>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500">No task submissions with status: {status}</p>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{submission.task.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                      <Badge className={getDifficultyColor(submission.task.difficulty)}>
                        {submission.task.difficulty}
                      </Badge>
                      <Badge variant="outline">{submission.task.type}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 mb-1">
                      <Award className="w-4 h-4 mr-1" />
                      <span className="font-medium">PKR {submission.task.reward}</span>
                    </div>
                    <p className="text-sm text-gray-500">{submission.timeAgo}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* User Info */}
                <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-500 mr-2" />
                  <div>
                    <p className="font-medium">{submission.user.name || submission.user.email}</p>
                    <p className="text-sm text-gray-500">Code: {submission.user.referralCode}</p>
                  </div>
                </div>

                {/* Tracking Data */}
                {submission.trackingData && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Submission Details</h4>
                    {submission.trackingData.proofText && (
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Proof:</strong> {submission.trackingData.proofText}
                      </p>
                    )}
                    {submission.trackingData.proofLinks && submission.trackingData.proofLinks.length > 0 && (
                      <div className="text-sm text-blue-800 mb-2">
                        <strong>Links:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {submission.trackingData.proofLinks.map((link: string, index: number) => (
                            <li key={index}>
                              <a href={link} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:underline">
                                {link}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {submission.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{submission.notes}</p>
                  </div>
                )}

                {/* Actions for Pending Submissions */}
                {submission.status === 'PENDING' && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleSubmission(submission.id, 'approve')}
                      disabled={processing === submission.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {processing === submission.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt('Reason for rejection (optional):')
                        if (reason !== null) { // User didn't cancel
                          handleSubmission(submission.id, 'reject', reason)
                        }
                      }}
                      disabled={processing === submission.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}