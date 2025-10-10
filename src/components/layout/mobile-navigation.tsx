'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  ShoppingBag, 
  CheckSquare, 
  Users, 
  User,
  Plus,
  Menu,
  X,
  Bell,
  Search,
  ShoppingCart,
  Wallet,
  TrendingUp,
  MessageSquare,
  Settings,
  LogOut,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MobileNavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  badge?: number
  isActive?: boolean
}

interface MobileNavigationProps {
  user?: {
    name?: string
    email?: string
    avatar?: string
    balance?: number
    unreadNotifications?: number
  }
  onLogout?: () => void
}

const mainNavItems: MobileNavItem[] = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Shop', href: '/products', icon: ShoppingBag },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Profile', href: '/profile', icon: User },
]

const quickActions = [
  { name: 'Add Task', href: '/tasks/new', icon: Plus, color: 'bg-green-600' },
  { name: 'Invite Friend', href: '/team/invite', icon: Users, color: 'bg-blue-600' },
  { name: 'Buy Product', href: '/products', icon: ShoppingBag, color: 'bg-purple-600' },
  { name: 'Check Earnings', href: '/dashboard/earnings', icon: DollarSign, color: 'bg-yellow-600' },
]

export default function MobileNavigation({ user, onLogout }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  useEffect(() => {
    setActiveTab(pathname)
  }, [pathname])

  // Handle swipe gestures for navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time

    // Check if it's a valid swipe (fast horizontal movement)
    const isSwipe = Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100 && deltaTime < 300

    if (isSwipe) {
      const currentIndex = mainNavItems.findIndex(item => item.href === activeTab)
      
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        router.push(mainNavItems[currentIndex - 1].href)
      } else if (deltaX < 0 && currentIndex < mainNavItems.length - 1) {
        // Swipe left - go to next tab
        router.push(mainNavItems[currentIndex + 1].href)
      }
    }

    touchStartRef.current = null
  }

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`
  }

  return (
    <>
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen(true)}
          className="h-9 w-9 p-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold text-green-600">MLM-Pak</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
            <Search className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
            <Bell className="h-5 w-5" />
            {user?.unreadNotifications && user.unreadNotifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
              >
                {user.unreadNotifications > 9 ? '9+' : user.unreadNotifications}
              </Badge>
            )}
          </Button>

          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white md:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex h-16 items-center justify-around px-2">
          {mainNavItems.map((item) => {
            const isActive = activeTab.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 rounded-lg px-2 py-1 text-xs transition-colors",
                  "min-w-0 flex-1 touch-manipulation", // Touch optimization
                  isActive
                    ? "text-green-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
                onClick={() => setActiveTab(item.href)}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", isActive && "text-green-600")} />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <div className="h-0.5 w-8 rounded-full bg-green-600" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Balance Display */}
            {user?.balance !== undefined && (
              <div className="border-b p-4">
                <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Available Balance</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(user.balance)}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="border-b p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className={cn("rounded-full p-1.5", action.color)}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {action.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                <Link
                  href="/dashboard/analytics"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Analytics</span>
                </Link>

                <Link
                  href="/messages"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Messages</span>
                  {user?.unreadNotifications && user.unreadNotifications > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {user.unreadNotifications}
                    </Badge>
                  )}
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>My Orders</span>
                </Link>

                <Link
                  href="/profile/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>

            {/* Menu Footer */}
            <div className="border-t p-4">
              <Button
                variant="ghost"
                onClick={() => {
                  onLogout?.()
                  setIsMenuOpen(false)
                }}
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Safe area bottom padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom md:hidden" />
    </>
  )
}

// Floating Action Button Component
export function FloatingActionButton({ 
  onClick, 
  icon: Icon = Plus, 
  className = "" 
}: { 
  onClick: () => void
  icon?: React.ComponentType<any>
  className?: string 
}) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-green-600 p-0 shadow-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 md:hidden",
        "touch-manipulation", // Better touch handling
        className
      )}
    >
      <Icon className="h-6 w-6 text-white" />
    </Button>
  )
}

// Hook for mobile navigation state
export function useMobileNavigation() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show/hide navigation based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false) // Scrolling down
      } else {
        setIsVisible(true) // Scrolling up
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return { isVisible }
} 