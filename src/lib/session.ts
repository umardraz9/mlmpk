import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'

// Simple session helper to avoid NextAuth version conflicts
// This creates a basic wrapper for session management

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
}

// Simple session getter - returns null for now to avoid conflicts
// This will be handled by client-side session management
export async function getSession(): Promise<ExtendedSession | null> {
  return null
}

// Helper to check if user is admin
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
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
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Authentication required - session not available')
  }
  return session
}