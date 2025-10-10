'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Clock, CheckCircle, AlertCircle, ExternalLink, MousePointer, Eye } from 'lucide-react'
import { TaskCompletionModal } from '@/components/ui/TaskCompletionModal'

interface TaskIframeProps {
  task: {
    id: string
    title: string
    articleUrl: string
    minDuration: number
    requireScrolling: boolean
    minScrollPercentage: number
    reward: number
    type?: string
    requireMouseMovement?: boolean
    minAdClicks?: number
  }
  onComplete: (taskId: string) => void
  onClose: () => void
}

export default function TaskIframe({ task, onComplete, onClose }: TaskIframeProps) {
  const [timeSpent, setTimeSpent] = useState(0)
  const [scrollPercentage, setScrollPercentage] = useState(0)
  const [canComplete, setCanComplete] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [userInteractions, setUserInteractions] = useState(0)
  const [iframeHeight, setIframeHeight] = useState(600)
  const [isScrollingActive, setIsScrollingActive] = useState(false)
  const [adClicks, setAdClicks] = useState(0)
  const [isCrossOrigin, setIsCrossOrigin] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionData, setCompletionData] = useState<{
    timeSpent: string;
    engagement: number;
    reward: number;
    bonusEarned?: number;
    streakCount?: number;
    levelUp?: boolean;
  } | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(Date.now())
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile to render compact UI and allocate ~85–90% to content
  useEffect(() => {
    const onResize = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Preconnect to article host to speed up first render
  useEffect(() => {
    try {
      const url = new URL(task.articleUrl)
      const hostOrigin = `${url.protocol}//${url.hostname}`
      const links: HTMLLinkElement[] = []

      const preconnect = document.createElement('link')
      preconnect.rel = 'preconnect'
      preconnect.href = hostOrigin
      preconnect.crossOrigin = 'anonymous'
      document.head.appendChild(preconnect)
      links.push(preconnect)

      const dnsPrefetch = document.createElement('link')
      dnsPrefetch.rel = 'dns-prefetch'
      dnsPrefetch.href = hostOrigin
      document.head.appendChild(dnsPrefetch)
      links.push(dnsPrefetch)

      return () => {
        links.forEach(l => {
          if (l.parentNode) l.parentNode.removeChild(l)
        })
      }
    } catch (_) {
      // ignore malformed URLs
    }
  }, [task.articleUrl])
  // Helper function to detect and handle different URL types
  const getOptimizedUrl = (url: string) => {
    // Handle YouTube URLs
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`
    }
    
    // For regular articles, try to use the URL directly
    // Some sites may block iframe embedding, but we'll handle that gracefully
    return url
  }

  const embedUrl = getOptimizedUrl(task.articleUrl)
  const isVideo = task.type === 'VIDEO_WATCH' || task.articleUrl.includes('youtube')
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Timer starts AFTER iframe is loaded
  useEffect(() => {
    if (!iframeLoaded) {
      setTimeSpent(0)
      return
    }
    startTimeRef.current = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setTimeSpent(elapsed)
    }, 1000)
    return () => clearInterval(interval)
  }, [iframeLoaded])

  // Evaluate completion conditions continuously
  useEffect(() => {
    const timeRequirementMet = timeSpent >= task.minDuration
    const scrollRequirementMet = !task.requireScrolling || scrollPercentage >= task.minScrollPercentage
    const interactionRequirementMet = !task.requireMouseMovement || userInteractions >= 3
    const adClickRequirementMet = !task.minAdClicks || adClicks >= (task.minAdClicks || 0)
    setCanComplete(timeRequirementMet && scrollRequirementMet && interactionRequirementMet && adClickRequirementMet && iframeLoaded)
  }, [timeSpent, task.minDuration, task.requireScrolling, task.minScrollPercentage, scrollPercentage, task.requireMouseMovement, userInteractions, task.minAdClicks, adClicks, iframeLoaded])

  // Enhanced iframe interaction tracking
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'scroll') {
        setScrollPercentage(event.data.percentage)
        setUserInteractions(prev => prev + 1)
      } else if (event.data.type === 'adClick') {
        setAdClicks(prev => prev + 1)
        setUserInteractions(prev => prev + 2)
      } else if (event.data.type === 'interaction') {
        setUserInteractions(prev => prev + 1)
      }
    }

    // Handle iframe container scroll as alternative
    const handleContainerScroll = () => {
      if (containerRef.current && iframeRef.current) {
        const container = containerRef.current
        const scrollTop = container.scrollTop
        const scrollHeight = container.scrollHeight - container.clientHeight
        const percentage = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0
        
        setScrollPercentage(Math.min(percentage, 100))
        setIsScrollingActive(true)
        setUserInteractions(prev => prev + 1)
        
        // Clear previous timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        
        // Set timeout to stop scroll tracking
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrollingActive(false)
        }, 1500)
      }
    }

    // Mouse movement and click tracking
    const handleMouseMove = () => {
      setUserInteractions(prev => prev + 1)
    }
    
    const handleClick = () => {
      setUserInteractions(prev => prev + 2) // Clicks are more valuable
    }

    window.addEventListener('message', handleMessage)
    
    if (containerRef.current) {
      containerRef.current.addEventListener('scroll', handleContainerScroll)
      containerRef.current.addEventListener('mousemove', handleMouseMove)
      containerRef.current.addEventListener('click', handleClick)
    }

    return () => {
      window.removeEventListener('message', handleMessage)
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleContainerScroll)
        containerRef.current.removeEventListener('mousemove', handleMouseMove)
        containerRef.current.removeEventListener('click', handleClick)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [iframeLoaded])

  const handleComplete = async () => {
    if (!canComplete || isCompleting) return

    setIsCompleting(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proofText: `Article reading task completed successfully`,
          notes: `Task completed via iframe - Time: ${timeSpent}s, Scroll: ${scrollPercentage}%, Interactions: ${userInteractions}`,
          metadata: {
            timeSpent,
            scrollPercentage,
            userInteractions,
            articleUrl: task.articleUrl,
            completedAt: new Date().toISOString(),
            taskType: 'CONTENT_ENGAGEMENT',
            adClicks,
            minAdClicks: task.minAdClicks || 0,
            validatedRequirements: {
              timeRequirement: timeSpent >= task.minDuration,
              scrollRequirement: !task.requireScrolling || scrollPercentage >= task.minScrollPercentage,
              interactionRequirement: !task.requireMouseMovement || userInteractions >= 3,
              adClickRequirement: !task.minAdClicks || adClicks >= (task.minAdClicks || 0)
            }
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete task')
      }

      const rewardDisplay = Math.round(result?.rewardEarned ?? task.reward)
      
      // Prepare data for premium modal
      setCompletionData({
        timeSpent: formatTime(timeSpent),
        engagement: scrollPercentage,
        reward: rewardDisplay,
        bonusEarned: result?.bonusEarned || 0,
        streakCount: result?.streakCount || 0,
        levelUp: result?.levelUp || false
      })
      
      // Show premium completion modal
      setShowCompletionModal(true)
      
      // Complete the task after a delay to show the modal
      setTimeout(() => {
        onComplete(task.id)
      }, 2000)
    } catch (error) {
      console.error('Error completing task:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`❌ Failed to complete task: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`)
    } finally {
      setIsCompleting(false)
    }
  }
  
  // Handle iframe load
  const handleIframeLoad = () => {
    setIframeLoaded(true)
    setUserInteractions(prev => prev + 1) // Count initial load as interaction
    
    // Try to inject tracking script if same-origin
    try {
      const iframe = iframeRef.current
      if (iframe?.contentWindow) {
        const script = `
          let scrollPercentage = 0;
          window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);
            parent.postMessage({ type: 'scroll', percentage: scrollPercentage }, '*');
          });
          
          window.addEventListener('click', function(event) {
            try {
              let el = event.target as Element | null;
              let isAd = false;
              while (el) {
                const id = (el as any).id ? String((el as any).id).toLowerCase() : '';
                const cls = (el as any).className ? String((el as any).className).toLowerCase() : '';
                if (/ad|adsense|sponsor|promot/.test(id) || /ad|adsense|sponsor|promot/.test(cls) || (el as any).getAttribute?.('data-ad') === 'true') {
                  isAd = true;
                  break;
                }
                if (el.tagName === 'A') {
                  const rel = (el as HTMLAnchorElement).getAttribute('rel') || '';
                  if (rel.toLowerCase().includes('sponsored')) { isAd = true; break; }
                }
                el = el.parentElement;
              }
              parent.postMessage({ type: isAd ? 'adClick' : 'interaction' }, '*');
            } catch (_) {
              parent.postMessage({ type: 'interaction' }, '*');
            }
          });
          
          window.addEventListener('mousemove', function() {
            parent.postMessage({ type: 'interaction' }, '*');
          });
        `
        // Type-safe script injection
        const win = iframe.contentWindow as any
        if (win && typeof win.eval === 'function') {
          win.eval(script)
        }
        setIsCrossOrigin(false)
      }
    } catch (e) {
      // Cross-origin restriction, will use alternative tracking
      console.log('Cross-origin iframe detected, using alternative tracking')
      setIsCrossOrigin(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Auto-resize iframe based on content (if possible)
  useEffect(() => {
    const resizeIframe = () => {
      try {
        if (iframeRef.current?.contentWindow?.document) {
          const newHeight = iframeRef.current.contentWindow.document.body.scrollHeight
          setIframeHeight(Math.max(600, Math.min(newHeight + 100, 800)))
        }
      } catch (e) {
        // Cross-origin restriction
      }
    }
    
    const interval = setInterval(resizeIframe, 2000)
    return () => clearInterval(interval)
  }, [iframeLoaded])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-none md:rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[100vh] md:max-h-[90vh] flex flex-col">
        {/* Mobile Compact Header */}
        <div className="md:hidden p-2 border-b bg-white sticky top-0 z-10 flex items-center justify-between">
          <div className="text-sm font-medium truncate pr-2">{task.title}</div>
          <button
            onClick={onClose}
            className="text-gray-600 p-1 rounded hover:bg-gray-100"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">{task.title}</h2>
            </div>
            <Badge className="bg-green-100 text-green-800 font-semibold">
              💰 PKR {task.reward}
            </Badge>
            {iframeLoaded && (
              <Badge className="bg-blue-100 text-blue-800">
                ✅ Loaded
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Enhanced Progress Indicators */}
            <div className="flex items-center space-x-2 text-sm">
              <Clock className={`h-4 w-4 ${timeSpent >= task.minDuration ? 'text-green-600' : 'text-orange-500'}`} />
              <span className={timeSpent >= task.minDuration ? 'text-green-600 font-bold' : 'text-gray-600'}>
                {formatTime(timeSpent)} / {formatTime(task.minDuration)}
              </span>
            </div>
            
            {task.requireScrolling && (
              <div className="flex items-center space-x-2 text-sm">
                <Eye className={`h-4 w-4 ${scrollPercentage >= task.minScrollPercentage ? 'text-green-600' : 'text-orange-500'}`} />
                <span className={scrollPercentage >= task.minScrollPercentage ? 'text-green-600 font-bold' : 'text-gray-600'}>
                  {scrollPercentage}% / {task.minScrollPercentage}%
                </span>
                {isScrollingActive && (
                  <span className="text-blue-600 animate-pulse">📖</span>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-sm">
              <MousePointer className={`h-4 w-4 ${userInteractions >= 3 ? 'text-green-600' : 'text-orange-500'}`} />
              <span className={userInteractions >= 3 ? 'text-green-600 font-bold' : 'text-gray-600'}>
                {userInteractions} interactions
              </span>
            </div>
            
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 hover:bg-red-50"
              aria-label="Close"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced Requirements Status (desktop only) */}
        <div className="hidden md:block px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                {timeSpent >= task.minDuration ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
                <span className={timeSpent >= task.minDuration ? 'text-green-700 font-medium' : 'text-gray-600'}>
                  ⏱️ Reading Time: {formatTime(timeSpent)} / {formatTime(task.minDuration)}
                </span>
              </div>
              
              {task.requireScrolling && (
                <div className="flex items-center space-x-2">
                  {scrollPercentage >= task.minScrollPercentage ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                  <span className={scrollPercentage >= task.minScrollPercentage ? 'text-green-700 font-medium' : 'text-gray-600'}>
                    📖 Reading Progress: {scrollPercentage}% / {task.minScrollPercentage}%
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                {!task.requireMouseMovement || userInteractions >= 3 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
                <span className={!task.requireMouseMovement || userInteractions >= 3 ? 'text-green-700 font-medium' : 'text-gray-600'}>
                  🖱️ Engagement: {userInteractions}{task.requireMouseMovement ? '/3 interactions' : ''}
                </span>
              </div>

              {task.minAdClicks ? (
                <div className="flex items-center space-x-2">
                  {adClicks >= (task.minAdClicks || 0) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                  <span className={adClicks >= (task.minAdClicks || 0) ? 'text-green-700 font-medium' : 'text-gray-600'}>
                    🎯 Ad Clicks: {adClicks}/{task.minAdClicks}
                  </span>
                </div>
              ) : null}
            </div>
            
            <div className="text-sm text-gray-500">
              {canComplete ? (
                <span className="text-green-600 font-semibold">✅ Ready to complete!</span>
              ) : (
                <span>Keep reading to complete all requirements</span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Compact Stats */}
        {isMobile && (
          <div className="md:hidden px-2 py-1 text-[11px] border-b bg-gray-50 flex items-center justify-between gap-2">
            <span className={`${timeSpent >= task.minDuration ? 'text-green-600' : 'text-gray-600'}`}>⏱ {formatTime(timeSpent)}/{formatTime(task.minDuration)}</span>
            {task.requireScrolling && (
              <span className={`${scrollPercentage >= task.minScrollPercentage ? 'text-green-600' : 'text-gray-600'}`}>📖 {scrollPercentage}%/{task.minScrollPercentage}%</span>
            )}
            <span className={`${!task.requireMouseMovement || userInteractions >= 3 ? 'text-green-600' : 'text-gray-600'}`}>🖱 {userInteractions}</span>
          </div>
        )}

        {/* Iframe Container */}
        <div className="flex-1 p-2 md:p-4 bg-gray-50">
          <div 
            ref={containerRef}
            className="w-full h-full overflow-auto bg-white rounded-none md:rounded-lg shadow-inner border-0 md:border-2 md:border-gray-200 relative pb-16 md:pb-0"
            style={(isMobile ? { height: '85vh' } : { height: `${iframeHeight}px` }) as React.CSSProperties}
          >
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading {isVideo ? 'video' : 'article'}...</p>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className={`w-full h-full border-0 rounded-lg ${isCrossOrigin ? 'sticky top-0' : ''}`}
              title={task.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
              onLoad={handleIframeLoad}
              style={{ minHeight: '600px' } as React.CSSProperties}
              allow={isVideo ? "autoplay; encrypted-media" : undefined}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {isCrossOrigin && (
              <div aria-hidden className="w-full" style={{ height: '2000px' } as React.CSSProperties} />
            )}
            
            {/* Scroll indicator overlay */}
            {task.requireScrolling && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                📖 {scrollPercentage}%
              </div>
            )}
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden md:block p-4 border-t bg-gradient-to-r from-gray-50 to-green-50">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {canComplete ? (
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">🎉 All requirements completed! Click to claim your reward.</span>
                </div>
              ) : (
                <div className="text-gray-600">
                  <div className="font-medium mb-1">📋 Complete all requirements to earn PKR {task.reward}:</div>
                  <div className="space-y-1 text-xs">
                    <div className={timeSpent >= task.minDuration ? 'text-green-600' : 'text-orange-600'}>
                      ⏱️ Read for at least {formatTime(task.minDuration)} ({timeSpent >= task.minDuration ? '✅' : `${formatTime(Math.max(0, task.minDuration - timeSpent))} remaining`})
                    </div>
                    {task.requireScrolling && (
                      <div className={scrollPercentage >= task.minScrollPercentage ? 'text-green-600' : 'text-orange-600'}>
                        📖 Scroll through {task.minScrollPercentage}% of the article ({scrollPercentage >= task.minScrollPercentage ? '✅' : `${Math.max(0, task.minScrollPercentage - scrollPercentage)}% remaining`})
                      </div>
                    )}
                    <div className={userInteractions >= 3 ? 'text-green-600' : 'text-orange-600'}>
                      🖱️ Show engagement with the content ({userInteractions >= 3 ? '✅' : `${Math.max(0, 3 - userInteractions)} more interactions needed`})
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              {isCrossOrigin && !!task.minAdClicks && adClicks < (task.minAdClicks || 0) && (
                <Button
                  onClick={() => setAdClicks(prev => prev + 1)}
                  variant="outline"
                  className="mr-3 border-yellow-300 text-yellow-800 bg-yellow-50 hover:bg-yellow-100"
                >
                  I clicked an ad
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="outline"
                className="hover:bg-red-50"
              >
                ❌ Cancel
              </Button>
              
              {timeSpent >= task.minDuration && (
                <Button
                  onClick={handleComplete}
                  disabled={!canComplete || isCompleting}
                  className={`${canComplete ? 'bg-green-600 hover:bg-green-700 animate-pulse' : 'bg-gray-400'} text-white font-semibold px-6`}
                >
                  {isCompleting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `🎉 Claim PKR ${Math.round(task.reward)}`
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        {isMobile && (
          <div className="md:hidden fixed bottom-2 left-2 right-2 z-50">
            <div className="bg-white shadow-lg rounded-full px-3 py-2 border flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {canComplete ? 'Ready to claim' : 'Keep reading to complete'}
              </span>
              {timeSpent >= task.minDuration && (
                <Button
                  onClick={handleComplete}
                  disabled={!canComplete || isCompleting}
                  size="sm"
                  className={`${canComplete ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white rounded-full px-4`}
                >
                  {isCompleting ? 'Processing…' : `Claim PKR ${Math.round(task.reward)}`}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Premium Task Completion Modal */}
      {showCompletionModal && completionData && (
        <TaskCompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false)
            setCompletionData(null)
          }}
          taskData={completionData}
        />
      )}
    </div>
  )
}
