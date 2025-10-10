'use client';

import React from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileLayout({ children, className = '' }: MobileLayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  );
}

interface MobilePageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function MobilePageContainer({ children, className = '' }: MobilePageContainerProps) {
  return (
    <div className={`container mx-auto px-4 py-6 ${className}`}>
      {children}
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCard({ children, className = '' }: MobileCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {children}
    </div>
  );
}

interface MobileGridProps {
  children: React.ReactNode;
  cols?: number;
  className?: string;
}

export function MobileGrid({ children, cols = 2, className = '' }: MobileGridProps) {
  const gridCols = cols === 1 ? 'grid-cols-1' : 
                   cols === 2 ? 'grid-cols-2' : 
                   cols === 3 ? 'grid-cols-3' : 
                   cols === 4 ? 'grid-cols-4' : 'grid-cols-2';
  
  return (
    <div className={`grid ${gridCols} gap-4 ${className}`}>
      {children}
    </div>
  );
}

interface MobileSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function MobileSection({ children, title, subtitle, className = '' }: MobileSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface MobileErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function MobileError({ message, onRetry, className = '' }: MobileErrorProps) {
  return (
    <MobileCard className={`text-center ${className}`}>
      <div className="py-8">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </MobileCard>
  );
}

export function GridSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 animate-pulse" />
      ))}
    </div>
  );
}
