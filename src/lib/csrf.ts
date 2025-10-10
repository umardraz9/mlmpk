import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Simple CSRF protection for API routes
export async function validateRequest(request: NextRequest) {
  try {
    // Get session to verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return { valid: false, error: 'Unauthorized', status: 401 };
    }

    // For now, we'll skip CSRF validation and rely on session-based auth
    // In production, you'd want proper CSRF tokens
    return { valid: true, userId: session.user.email };
  } catch (error) {
    console.error('Request validation error:', error);
    return { valid: false, error: 'Validation failed', status: 500 };
  }
}

// Get CSRF token for frontend requests
export function getCSRFToken(): string {
  // For now, return a simple token based on session
  // In production, implement proper CSRF token generation
  return 'csrf-token-placeholder';
}
