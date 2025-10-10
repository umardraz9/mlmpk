'use client';

import React, { useState, useEffect } from 'react';
import { Share, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NetworkStatus } from '@/components/ui/mobile-error';
import { MobileBottomNav, useShowBottomNav } from './mobile-bottom-nav';
import { useTheme } from '@/contexts/ThemeContext';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showShareButton?: boolean;
  showBookmarkButton?: boolean;
  showBottomNav?: boolean;
  actions?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  paddingBottom?: boolean;
}

export function MobileLayout({
  children,
  title,
  subtitle,
  showShareButton = false,
  showBookmarkButton = false,
  showBottomNav,
  actions,
  className,
  headerClassName,
  contentClassName,
  paddingBottom = true
}: MobileLayoutProps) {
  const { isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const shouldShowBottomNav = useShowBottomNav();
  const displayBottomNav = showBottomNav !== undefined ? showBottomNav : shouldShowBottomNav;

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Scroll tracking for header effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'MCNmart.com',
          url: window.location.href
        });
      } catch (error) {
        console.error('Share failed', error);
        // Fallback to clipboard
        navigator.clipboard?.writeText(window.location.href);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-300',
      isDark ? 'bg-gray-900' : 'bg-gray-50',
      className
    )}>
      <NetworkStatus isOnline={isOnline} />
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      {/* Mobile Header */}
      <header 
        className={cn(
          'sticky top-0 z-40 border-b transition-all duration-300',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
          scrollY > 10 && 'shadow-sm',
          headerClassName
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2" />

          {/* Center - Title */}
          <div className="flex-1 text-center px-4">
            {title && (
              <div className="space-y-1">
                <h1 className={`text-lg font-semibold truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {title}
                </h1>
                {subtitle && (
                  <p className={`text-xs truncate ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-1">
            {showShareButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-9 w-9 p-0"
                aria-label="Share page"
              >
                <Share className="h-4 w-4" />
              </Button>
            )}
            
            {showBookmarkButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                aria-label="Bookmark page"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            )}
            
            {actions}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        id="main-content"
        role="main"
        className={cn(
          'flex-1',
          paddingBottom && displayBottomNav && 'pb-20 md:pb-4', // Space for bottom nav on mobile
          paddingBottom && !displayBottomNav && 'pb-4',
          contentClassName
        )}
      >
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      {displayBottomNav && <MobileBottomNav />}
    </div>
  );
}

// Page container with consistent padding and spacing
export function MobilePageContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('px-4 py-6 space-y-6 max-w-7xl mx-auto', className)}>
      {children}
    </div>
  );
}

// Section container for grouping content
export function MobileSection({ 
  title, 
  subtitle,
  children, 
  className,
  headerAction
}: { 
  title?: string;
  subtitle?: string;
  children: React.ReactNode; 
  className?: string;
  headerAction?: React.ReactNode;
}) {
  const { isDark } = useTheme();
  
  return (
    <section className={cn('space-y-4', className)}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className={`text-xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction}
        </div>
      )}
      {children}
    </section>
  );
}

// Card component optimized for mobile
export function MobileCard({ 
  children, 
  className, 
  padding = true,
  clickable = false,
  onClick
}: { 
  children: React.ReactNode; 
  className?: string;
  padding?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const { isDark } = useTheme();
  
  return (
    <div 
      className={cn(
        'rounded-lg border shadow-sm transition-colors duration-300 motion-safe:transition-transform motion-safe:hover:translate-y-[1px]',
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        padding && 'p-4',
        clickable && 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]',
        className
      )}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// Grid layout optimized for mobile
export function MobileGrid({ 
  children, 
  columns = 2, 
  className 
}: { 
  children: React.ReactNode; 
  columns?: 1 | 2 | 3 | 4;
  className?: string; 
}) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    3: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    4: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'
  };

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {children}
    </div>
  );
}

// List layout optimized for mobile
export function MobileList({ 
  children, 
  className,
  divider = true 
}: { 
  children: React.ReactNode; 
  className?: string;
  divider?: boolean;
}) {
  const { isDark } = useTheme();
  
  return (
    <div className={cn('space-y-1', className)}>
      {React.Children.map(children, (child, index) => (
        <div key={index}>
          {child}
          {divider && index < React.Children.count(children) - 1 && (
            <hr className={`my-3 ${
              isDark ? 'border-gray-700' : 'border-gray-100'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
