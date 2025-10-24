'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function ProfileByUsernamePage() {
  const params = useParams()
  const username = params?.username as string
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      if (!username) return
      
      try {
        setLoading(true)
        setError(null)
        
        console.log('[PROFILE PAGE] Fetching profile for:', username)
        
        const response = await fetch(`/api/social/profile/${username}`)
        const data = await response.json()
        
        console.log('[PROFILE PAGE] API response:', data)
        
        if (data.success && data.user) {
          setUser(data.user)
        } else {
          setError(data.error || 'Failed to load profile')
        }
      } catch (err) {
        console.error('[PROFILE PAGE] Error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The user you're looking for doesn't exist."}</p>
          <a href="/social" className="text-blue-600 hover:underline">Back to Social</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        {user.coverImage && (
          <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={user.image}
                alt={user.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 py-4">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600 mb-2">@{user.username}</p>
              <p className="text-gray-700 mb-4">{user.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {user.location && <span>📍 {user.location}</span>}
                {user.website && <span>🔗 {user.website}</span>}
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">1.2K</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">342</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">45</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">Profile content coming soon...</p>
        </div>
      </div>
    </div>
  )
}
