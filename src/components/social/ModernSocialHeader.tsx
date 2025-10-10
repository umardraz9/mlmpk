'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationCenter from '@/components/notifications/NotificationCenter';
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

// Notification badge is now handled inside NotificationCenter

// Message Notification Badge Component
function MessageNotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/messages/unread-count', { headers: { 'Cache-Control': 'no-cache' } });
        if (res.ok) {
          const data = await res.json();
          setCount(data.count ?? data.unreadCount ?? 0);
        }
      } catch (error) {
        console.error('Failed to fetch message count:', error);
      }
    };

    // Initial and periodic refresh (every 10s)
    fetchCount();
    const interval = setInterval(fetchCount, 10000);

    // Refresh on window focus
    const onFocus = () => fetchCount();
    window.addEventListener('focus', onFocus);

    // Live updates via notifications SSE
    const es = new EventSource('/api/notifications/stream');
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'notification' && payload?.data?.type === 'message') {
          // A message notification arrived; recompute from API to avoid double counting
          fetchCount();
        }
      } catch {}
    };
    es.onerror = () => { try { es.close(); } catch {} };

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      try { es.close(); } catch {}
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export default function ModernSocialHeader() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Search */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
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
              <Link
                href="/social"
                className="flex items-center justify-center w-28 h-12 rounded-lg hover:bg-gray-100 transition-colors relative group"
              >
                <Home className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-lg opacity-100"></div>
              </Link>
              <Link
                href="/social/people"
                className="flex items-center justify-center w-28 h-12 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <Users className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
              </Link>
              <Link
                href="/social/reels"
                className="flex items-center justify-center w-28 h-12 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <Video className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
              </Link>
              <Link
                href="/products"
                className="flex items-center justify-center w-28 h-12 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <Store className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-center w-28 h-12 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <Grid3X3 className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
              </Link>
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
            >
              <MessageCircle className="h-5 w-5 text-gray-700" />
              <MessageNotificationBadge />
            </Link>

            {/* Notifications (dropdown) */}
            <NotificationCenter className="ml-1" />

            {/* User Profile */}
            <Link href="/social/profile" className="ml-2">
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
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
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Home</span>
            </Link>
            <Link
              href="/social/people"
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-purple-600 hover:bg-purple-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">People</span>
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-700 hover:text-green-600 hover:bg-green-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">Messages</span>
            </Link>

            <hr className="my-3" />

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Create Post
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
