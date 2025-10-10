'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string
  // Add other fields as needed
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const taskId = resolvedParams.id
  
  return <TaskDetailPageClient taskId={taskId} />
}

function TaskDetailPageClient({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) return
    const fetchTask = async () => {
      try {
        const res = await fetch(`/api/admin/tasks/${taskId}`)
        if (res.ok) {
          const data = await res.json()
          setTask(data.task)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTask()
  }, [taskId])

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  if (!task) {
    return <div className="p-6 text-center">Task not found.</div>
  }

  return (
    <div className="container mx-auto p-6">
      <Button variant="outline" className="mb-4" onClick={() => router.back()}>
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{task.description}</p>
          {/* Additional task details here */}
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link href="/admin/tasks" className="text-blue-600 hover:underline">
          &larr; Back to tasks list
        </Link>
      </div>
    </div>
  )
}
