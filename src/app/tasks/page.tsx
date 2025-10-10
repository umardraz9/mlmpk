'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Target } from 'lucide-react'
import RealTimeTaskList from '@/components/RealTimeTaskList'

export default function TasksPage() {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
            <p className="text-gray-600 mb-4">Please sign in to access tasks and rewards.</p>
            <button 
              onClick={() => router.push('/auth/login?callbackUrl=/tasks')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasks & Rewards</h1>
          <p className="text-gray-600">Complete tasks to earn rewards</p>
        </div>
        
        {/* Real-Time Task List */}
        <RealTimeTaskList />
      </div>
    </div>
  )
}