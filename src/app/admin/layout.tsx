'use client'

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminSidebarWrapper from '@/components/admin/AdminSidebarWrapper';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

interface AdminLayoutProps {
  children: ReactNode;
}

type AdminSessionUser = {
  isAdmin?: boolean;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDark } = useTheme();

  // Type-safe check for admin access
  const user = session?.user as AdminSessionUser | undefined;
  const isAdmin = Boolean(user?.isAdmin);

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
      router.push('/admin/login');
    }
  }, [status, isAdmin, router]);

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'
      }`}>
        <div className={`rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${
          isDark ? 'bg-gray-900/80 border border-gray-800 text-gray-100' : 'bg-white'
        }`}>
          <div className={`animate-spin rounded-full h-16 w-16 border-4 mx-auto mb-4 ${
            isDark ? 'border-gray-700 border-t-green-400' : 'border-blue-200 border-t-blue-600'
          }`}></div>
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Loading Admin Panel</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Please wait while we verify your access</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'
      }`}>
        <div className={`rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${
          isDark ? 'bg-gray-900/80 border border-gray-800 text-gray-100' : 'bg-white'
        }`}>
          <div className={`animate-spin rounded-full h-16 w-16 border-4 mx-auto mb-4 ${
            isDark ? 'border-red-900 border-t-red-500' : 'border-red-200 border-t-red-600'
          }`}></div>
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Access Denied</h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Redirecting to admin login...</p>
        </div>
      </div>
    );
  }

  // Render admin layout for authenticated admins
  return (
    <div className={`flex h-screen transition-colors duration-300 ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      {/* Admin Sidebar */}
      <AdminSidebarWrapper />

      {/* Main Content */}
      <main className="flex-1 overflow-auto lg:ml-64">
        <div className={`sticky top-0 z-50 flex justify-end px-6 pt-6 lg:hidden ${
          isDark ? 'bg-gray-950/90' : 'bg-white/70 backdrop-blur'
        }`}>
          <ThemeToggle />
        </div>
        <div className="px-6 pb-6">
          <div className="hidden lg:flex justify-end mb-6">
            <ThemeToggle />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
