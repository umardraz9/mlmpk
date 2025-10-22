import { cookies } from 'next/headers'

// Extended session interface with proper typing
export interface ExtendedSession {
  user: {
    id: string
    email: string
    name: string
    image?: string
    isAdmin?: boolean
    role?: string
    referralCode?: string
    phone?: string
    balance?: number
    walletBalance?: number
  }
  expires: string
  loginTime: string
}

// Server-side session getter using our custom cookie
export async function getServerSession(): Promise<ExtendedSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('mlmpk-session')
    
    if (!sessionCookie) {
      return null
    }
    
    const sessionData = JSON.parse(sessionCookie.value)
    
    // Check if session is expired
    const expiresAt = new Date(sessionData.expires)
    const now = new Date()
    
    if (now > expiresAt) {
      return null
    }
    
    return sessionData
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

// Simple session getter - alias for compatibility
export async function getSession(): Promise<ExtendedSession | null> {
  return getServerSession()
}

// Helper to check if user is admin
export async function requireAdmin() {
  const session = await getServerSession()
  if (!session?.user) {
    throw new Error('Admin access required - session not available')
  }
  if (!session.user.isAdmin) {
    throw new Error('Admin access required')
  }
  return session
}

// Helper to get authenticated user
export async function requireAuth() {
  const session = await getServerSession()
  if (!session?.user) {
    throw new Error('Authentication required - session not available')
  }
  return session
}

// Helper to require session - alias for compatibility
export async function requireSession() {
  return requireAuth()
}