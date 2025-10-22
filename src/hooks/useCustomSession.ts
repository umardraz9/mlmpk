'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  role: string;
  referralCode?: string;
  phone?: string;
  balance?: number;
}

interface SessionData {
  user: User;
  expires: string;
  loginTime: string;
}

interface CustomSession {
  data: SessionData | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

export function useCustomSession(): CustomSession {
  const [session, setSession] = useState<CustomSession>({
    data: null,
    status: 'loading'
  });

  useEffect(() => {
    const checkSession = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          setSession({ data: null, status: 'unauthenticated' });
          return;
        }

        // Get the session cookie
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(cookie => 
          cookie.trim().startsWith('mlmpk-session=')
        );

        if (!sessionCookie) {
          setSession({ data: null, status: 'unauthenticated' });
          return;
        }

        // Extract and parse the session data
        const sessionValue = sessionCookie.split('=')[1];
        const decodedValue = decodeURIComponent(sessionValue);
        const sessionData: SessionData = JSON.parse(decodedValue);

        // Check if session is expired
        const expiresAt = new Date(sessionData.expires);
        const now = new Date();

        if (now > expiresAt) {
          // Session expired, clear it
          document.cookie = 'mlmpk-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          setSession({ data: null, status: 'unauthenticated' });
          return;
        }

        // Session is valid
        setSession({ data: sessionData, status: 'authenticated' });

      } catch (error) {
        console.error('Error checking session:', error);
        setSession({ data: null, status: 'unauthenticated' });
      }
    };

    // Check session immediately
    checkSession();

    // Set up periodic session check (every 30 seconds)
    const interval = setInterval(checkSession, 30000);

    // Listen for storage events (in case session is updated in another tab)
    const handleStorageChange = () => checkSession();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return session;
}

// Custom signOut function
export const customSignOut = (options?: { callbackUrl?: string }) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  // Clear the session cookie
  document.cookie = 'mlmpk-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Redirect to login or specified callback URL
  const redirectUrl = options?.callbackUrl || '/auth/login';
  window.location.href = redirectUrl;
};
