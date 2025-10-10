/**
 * Browser Environment Check Utility
 * 
 * This utility provides a safe way to check if code is running in a browser environment
 * and access browser-specific APIs safely.
 */

// Check if running in browser environment
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

// Check if running in server environment
export const isServer = (): boolean => {
  return typeof window === 'undefined';
};

// Safely access window object
export const safeWindow = (): Window | undefined => {
  return isBrowser() ? window : undefined;
};

// Safely access document object
export const safeDocument = (): Document | undefined => {
  return isBrowser() ? document : undefined;
};

// Safely access localStorage
export const safeLocalStorage = (): Storage | undefined => {
  return isBrowser() && window.localStorage ? localStorage : undefined;
};

// Safely access sessionStorage
export const safeSessionStorage = (): Storage | undefined => {
  return isBrowser() && window.sessionStorage ? sessionStorage : undefined;
};

// Safely access navigator
export const safeNavigator = (): Navigator | undefined => {
  return isBrowser() && navigator ? navigator : undefined;
};

// Safe audio context access
export const createAudioContext = (): AudioContext | undefined => {
  if (!isBrowser()) return undefined;
  
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (error) {
    console.error('Failed to create audio context:', error);
    return undefined;
  }
};

// Safe notification access
export const createNotification = (title: string, options?: NotificationOptions): Notification | undefined => {
  if (!isBrowser() || !('Notification' in window)) return undefined;
  
  try {
    if (Notification.permission === 'granted') {
      return new Notification(title, options);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
  
  return undefined;
};

// Safe media query check
export const matchMedia = (query: string): MediaQueryList | undefined => {
  if (!isBrowser() || !window.matchMedia) return undefined;
  
  try {
    return window.matchMedia(query);
  } catch (error) {
    console.error('Failed to match media query:', error);
    return undefined;
  }
};

// Safe URL creation
export const createObjectURL = (object: Blob | MediaSource): string | undefined => {
  if (!isBrowser() || !window.URL) return undefined;
  
  try {
    return window.URL.createObjectURL(object);
  } catch (error) {
    console.error('Failed to create object URL:', error);
    return undefined;
  }
};

// Safe URL revocation
export const revokeObjectURL = (url: string): void => {
  if (!isBrowser() || !window.URL) return;
  
  try {
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to revoke object URL:', error);
  }
};

// Export all functions as default object
export default {
  isBrowser,
  isServer,
  safeWindow,
  safeDocument,
  safeLocalStorage,
  safeSessionStorage,
  safeNavigator,
  createAudioContext,
  createNotification,
  matchMedia,
  createObjectURL,
  revokeObjectURL
};
