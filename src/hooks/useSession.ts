// Compatibility layer for NextAuth useSession
// This allows existing components to work without modification
'use client';

import { useCustomSession, customSignOut } from './useCustomSession';

// Export the custom session hook as useSession for compatibility
export const useSession = useCustomSession;

// Export signOut for compatibility
export const signOut = customSignOut;

// Re-export everything from the custom session
export * from './useCustomSession';
