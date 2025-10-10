'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home,
  ShoppingBag,
  Users,
  MessageSquare,
  User,
  CheckSquare,
  CreditCard,
  BookOpen,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TouchButton } from '@/components/ui/mobile-touch';
import { useTheme } from '@/contexts/ThemeContext';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

const navigationItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Home'
  },
  {
    href: '/tasks',
    icon: CheckSquare,
    label: 'Tasks'
  },
  {
    href: '/products',
    icon: ShoppingBag,
    label: 'Shop'
  },
  {
    href: '/social',
    icon: MessageSquare,
    label: 'Social'
  },
  {
    href: '/team',
    icon: Users,
    label: 'Team'
  }
];

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();

  const handleNavigation = (href: string) => {
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    router.push(href);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation - Only visible on mobile */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t shadow-lg transition-colors duration-300 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-5 h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <TouchButton
                key={item.href}
                variant="ghost"
                className={cn(
                  "flex flex-col items-center justify-center h-full px-1 py-2 rounded-none relative",
                  "transition-all duration-200 ease-in-out",
                  active 
                    ? isDark 
                      ? "text-green-400 bg-green-900/20" 
                      : "text-green-600 bg-green-50"
                    : isDark
                      ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                onClick={() => handleNavigation(item.href)}
                aria-label={item.label}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active && "scale-110"
                  )} />
                  
                  {/* Badge for notifications */}
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    </div>
                  )}
                </div>
                
                <span className={cn(
                  "text-xs font-medium mt-1 transition-colors duration-200",
                  active 
                    ? isDark ? "text-green-400" : "text-green-600"
                    : isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {active && (
                  <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full ${
                    isDark ? 'bg-green-400' : 'bg-green-600'
                  }`} />
                )}
              </TouchButton>
            );
          })}
        </div>
      </nav>

      {/* Safe area for devices with home indicator */}
      <div className={`fixed bottom-0 left-0 right-0 h-safe-area-inset-bottom md:hidden ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`} />
    </>
  );
}

// Hook to check if current page should show bottom navigation
export function useShowBottomNav() {
  const pathname = usePathname();
  
  // Pages that should show bottom navigation
  const showOnPages = [
    '/',
    '/dashboard',
    '/tasks',
    '/products',
    '/social',
    '/team',
    '/orders',
    '/payment',
    '/blog'
  ];
  
  // Don't show on admin pages, auth pages, or specific routes
  const hideOnPages = [
    '/admin',
    '/login',
    '/register',
    '/auth',
    '/checkout',
    '/cart'
  ];
  
  // Check if current path should hide bottom nav
  const shouldHide = hideOnPages.some(path => pathname.startsWith(path));
  if (shouldHide) return false;
  
  // Check if current path should show bottom nav
  const shouldShow = showOnPages.some(path => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  });
  
  return shouldShow;
}

export default MobileBottomNav;
