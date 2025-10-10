'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Download, Smartphone, Zap, Wifi, Shield } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Check if already installed
    const checkInstalled = () => {
      try {
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
        setIsInstalled(window.matchMedia('(display-mode: standalone)').matches)
      } catch (error) {
        console.error('Error checking PWA install status:', error)
      }
    }

    // Check for iOS
    const checkIOS = () => {
      try {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        setIsIOS(isIOS)
      } catch (error) {
        console.error('Error checking iOS:', error)
      }
    }

    checkInstalled()
    checkIOS()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show install prompt after a delay (better UX)
      setTimeout(() => {
        if (!isInstalled && !isStandalone) {
          setShowInstallPrompt(true)
        }
      }, 10000) // 10 seconds delay
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      
      // Track installation
      if (typeof window !== 'undefined' && 'gtag' in window) {
        ;(window as any).gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: 'App Installed'
        })
      }
    }

    // Only add event listeners in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.addEventListener('appinstalled', handleAppInstalled)
    }

    // Check if user has dismissed the prompt before (browser only)
    let hasUserDismissed = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      hasUserDismissed = localStorage.getItem('pwa-install-dismissed')
    }
    if (hasUserDismissed) {
      const dismissedTime = parseInt(hasUserDismissed)
      const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      
      // Show again after 7 days
      if (daysSinceDismissal < 7) {
        setShowInstallPrompt(false)
      }
    }

    return () => {
      // Only remove event listeners in browser environment
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [isInstalled, isStandalone])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        
        // Track acceptance
        if (typeof window !== 'undefined' && 'gtag' in window) {
          ;(window as any).gtag('event', 'pwa_install_prompt_accepted', {
            event_category: 'PWA',
            event_label: 'Install Prompt Accepted'
          })
        }
      } else {
        console.log('User dismissed the install prompt')
        
        // Track dismissal
        if (typeof window !== 'undefined' && 'gtag' in window) {
          ;(window as any).gtag('event', 'pwa_install_prompt_dismissed', {
            event_category: 'PWA',
            event_label: 'Install Prompt Dismissed'
          })
        }
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Only use localStorage in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
    
    // Track dismissal
    if (typeof window !== 'undefined' && 'gtag' in window) {
      ;(window as any).gtag('event', 'pwa_install_banner_dismissed', {
        event_category: 'PWA',
        event_label: 'Install Banner Dismissed'
      })
    }
  }

  // Don't show if already installed
  if (isInstalled || isStandalone || !showInstallPrompt) {
    return null
  }

  return (
    <>
      {/* Install Banner */}
      <Card className="fixed bottom-4 left-4 right-4 z-50 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg md:bottom-6 md:left-6 md:right-auto md:max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Install MLM-Pak App
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-gray-600 mt-1">
                Get faster access and work offline
              </p>

              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>Fast</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Wifi className="h-3 w-3" />
                  <span>Offline</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Secure</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-3">
                {deferredPrompt && !isIOS && (
                  <Button
                    onClick={handleInstallClick}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Install App
                  </Button>
                )}
                
                {isIOS && (
                  <Button
                    onClick={() => setShowInstallPrompt(false)}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Learn How
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* iOS Installation Instructions */}
      {isIOS && showInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-sm bg-white">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>
                
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Install MLM-Pak App
                </h3>
                
                <div className="mt-4 space-y-3 text-left text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-600">
                      1
                    </span>
                    <span>Tap the share button in Safari</span>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-600">
                      2
                    </span>
                    <span>Scroll down and tap "Add to Home Screen"</span>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-600">
                      3
                    </span>
                    <span>Tap "Add" to install the app</span>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Maybe Later
                  </Button>
                  <Button
                    onClick={() => {
                      setShowInstallPrompt(false)
                      // You could track this as "instructions viewed"
                    }}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Got It
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Hook for PWA status
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      setIsInstalled(window.matchMedia('(display-mode: standalone)').matches)
    }

    checkInstalled()

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstallable(false)
      }
    }
  }

  return {
    isInstalled,
    isInstallable,
    promptInstall
  }
} 