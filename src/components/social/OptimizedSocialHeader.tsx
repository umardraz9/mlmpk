'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSession } from '@/hooks/useSession';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useEventSource } from '@/lib/EventSourceManager';
import { debounce } from '@/lib/performance-utils';
import {
  Home,
  Search,
  Users,
  Menu,
  X,
  MessageCircle,
  Video,
  Store,
  Grid3X3
} from 'lucide-react';

/**
 * Optimized Message Notification Badge with EventSource pooling
 */
const MessageNotificationBadge = memo(function MessageNotificationBadge() {
  const [count, setCount] = useState(0);

  // Debounced fetch to prevent excessive API calls
  const debouncedFetch = useMemo(
    () =>
      debounce(async () => {
        try {
          const res = await fetch('/api/messages/unread-count', {
            headers: { 'Cache-Control': 'max-age=30' },
          });
          if (res.ok) {
            const data = await res.json();
            setCount(data.count ?? data.unreadCount ?? 0);
          }
        } catch (error) {
          console.error('Failed to fetch message count:', error);
        }
      }, 500),
    []
  );

  // Initial fetch
  useEffect(() => {
    debouncedFetch();
  }, [debouncedFetch]);

  // Subscribe to real-time updates using shared EventSource
  useEventSource(
    'notification',
    useCallback(
      (payload: any) => {
        if (payload?.data?.type === 'message') {
          debouncedFetch();
        }
      },
      [debouncedFetch]
    )
  );

  // Refetch on window focus (debounced)
  useEffect(() => {
    const handleFocus = () => debouncedFetch();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [debouncedFetch]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
      {count > 9 ? '9+' : count}
    </span>
  );
});

/**
 * Optimized Navigation Links with prefetching
 */
const NavLink = memo(function NavLink({
  href,
  icon: Icon,
  active = false,
  onClick,
}: {
  href: string;
  icon: typeof Home;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center w-28 h-12 rounded-lg hover:bg-gray-100 transition-colors relative group"
      onClick={onClick}
      prefetch={true}
    >
      <Icon className={`h-6 w-6 ${active ? 'text-blue-600' : 'text-gray-600'} group-hover:text-blue-600`} />
      {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-lg" />}
    </Link>
  );
});

/**
 * Optimized Mobile Menu
 */
const MobileMenu = memo(function MobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden border-t bg-white border-gray-200">
      <div className="px-4 py-3 space-y-2">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts, people..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white"
            />
          </div>
        </div>

        <Link
          href="/social"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50"
          onClick={onClose}
        >
          <Home className="h-5 w-5" />
          <span className="font-medium">Home</span>
        </Link>
        <Link
          href="/social/people"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-purple-600 hover:bg-purple-50"
          onClick={onClose}
        >
          <Users className="h-5 w-5" />
          <span className="font-medium">People</span>
        </Link>
        <Link
          href="/messages"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-green-600 hover:bg-green-50"
          onClick={onClose}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Messages</span>
        </Link>

        <hr className="my-3" />

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
          Create Post
        </button>
      </div>
    </div>
  );
});

/**
 * Main Optimized Social Header Component
 */
export default function OptimizedSocialHeader() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Search */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2" prefetch={true}>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">f</span>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:block w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Facebook"
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <NavLink href="/social" icon={Home} active={true} />
              <NavLink href="/social/people" icon={Users} />
              <NavLink href="/social/reels" icon={Video} />
              <NavLink href="/products" icon={Store} />
              <NavLink href="/dashboard" icon={Grid3X3} />
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Messages */}
            <Link
              href="/messages"
              className="relative p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
              aria-label="Messages"
              title="Messages"
              prefetch={true}
            >
              <MessageCircle className="h-5 w-5 text-gray-700" />
              <MessageNotificationBadge />
            </Link>

            {/* Notifications (dropdown) */}
            <NotificationCenter className="ml-1" />

            {/* User Profile */}
            <Link href="/social/profile" className="ml-2" prefetch={true}>
              <Avatar className="h-10 w-10 ring-2 ring-gray-200 hover:ring-blue-500 transition-all">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {session?.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMenu} />
    </header>
  );
}
