'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

// Lazy load components for better performance
const OptimizedRealTimeFeed = dynamic(() => import('@/components/social/OptimizedRealTimeFeed'), {
  loading: () => <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-48 bg-gray-200 rounded"></div>
  </div>
});

const ModernSocialHeader = dynamic(() => import('@/components/social/ModernSocialHeader'), {
  loading: () => <div className="h-16 bg-white border-b animate-pulse"></div>
});

const FacebookSidebar = dynamic(() => import('@/components/social/FacebookSidebar'), {
  loading: () => <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse h-64"></div>
});

const FacebookRightSidebar = dynamic(() => import('@/components/social/FacebookRightSidebar'), {
  loading: () => <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse h-64"></div>
});

export default function FacebookSocialPage() {
  const { data: session } = useSession();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed header */}
      <ModernSocialHeader />

      {/* Page content with sidebars - Mobile Optimized */}
      <div className="container mx-auto px-2 sm:px-4 pt-[68px] pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6">
          {/* Left Sidebar - Hidden on mobile, shown as bottom sheet */}
          <aside className="hidden lg:block lg:col-span-3 order-2">
            <FacebookSidebar />
          </aside>

          {/* Main Feed */}
          <main className="col-span-1 lg:col-span-6 order-1 min-h-screen">
            {session ? (
              <OptimizedRealTimeFeed />
            ) : (
              <div className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg rounded-xl p-6 sm:p-8 lg:p-12 text-center mx-2 sm:mx-0">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Welcome to MLM-Pak Social</h2>
                  <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                    Connect with your network, share updates, and discover new opportunities in our premium social platform.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => (window.location.href = '/auth/login')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 touch-manipulation min-h-[44px]"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => (window.location.href = '/auth/signup')}
                      className="bg-white text-gray-700 border-2 border-gray-300 px-6 sm:px-8 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 touch-manipulation min-h-[44px]"
                    >
                      Join Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-3 order-3">
            <FacebookRightSidebar />
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Floating Action Button for sidebar */}
      {session && (
        <>
          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <button
              className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center touch-manipulation"
              aria-label="Open sidebar menu"
              title="Open sidebar menu"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </button>
          </div>

          <Dialog open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <DialogContent className="p-0 w-[95vw] max-w-sm rounded-xl overflow-hidden">
              <FacebookSidebar onNavigate={() => setMobileSidebarOpen(false)} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
