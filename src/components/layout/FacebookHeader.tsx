'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from '@/hooks/useSession';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService, type ProfileData } from '@/lib/profile-service';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  Bell, 
  MessageSquare, 
  User, 
  LogOut, 
  Settings, 
  Search,
  Menu,
  X,
  Home,
  ShoppingBag,
  Users,
  TrendingUp,
  Calendar,
  Briefcase,
  DollarSign,
  BarChart3,
  UserPlus,
  Heart,
  Share,
  MessageCircle,
  Eye,
  Clock,
  Sun,
  Moon,
  FileText,
  ShoppingCart,
  Package,
  CheckCircle,
  Shield,
  TestTube,
  Mail,
  ChevronDown,
  Video,
  Store,
  Gamepad2,
  PlayCircle
} from 'lucide-react';

interface FacebookHeaderProps {
  isAuthenticated?: boolean;
  userName?: string;
  isAdmin?: boolean;
  userId?: string;
}

export default function FacebookHeader({ isAuthenticated = false, userName, isAdmin = false, userId }: FacebookHeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // State management
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  
  // Counts and loading states
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [loadingUnread, setLoadingUnread] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);
  
  // Data states
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Handle navigation
  const handleLinkClick = (path: string) => {
    router.push(path);
    setShowNotifications(false);
    setShowMessages(false);
    setShowMobileMenu(false);
  };

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark as read
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH'
      });

      // Update local state
      setUserNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );

      // Navigate based on notification type
      let redirectUrl = '/notifications';
      
      if (notification.data) {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;
        
        if (data.kind === 'POST_COMMENT' || data.kind === 'POST_LIKE' || data.kind === 'POST_SHARE') {
          redirectUrl = '/social';
        } else if (data.kind === 'FOLLOW') {
          redirectUrl = `/social/profile/${data.senderId}`;
        } else if (notification.type === 'message') {
          redirectUrl = `/messages?user=${data.senderId}`;
        }
      } else if (notification.type === 'message') {
        redirectUrl = '/messages';
      }

      handleLinkClick(redirectUrl);
    } catch (error) {
      console.error('Error handling notification click:', error);
      handleLinkClick('/notifications');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
          setUnreadCount(0);
          console.log(`✅ Marked ${data.markedAsRead} notifications as read`);
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch unread notifications and messages count periodically when authenticated
  useEffect(() => {
    let interval: any;
    async function fetchUnreadCounts() {
      if (!isAuthenticated && !session) return;
      try {
        setLoadingUnread(true);
        setLoadingMessages(true);
        setLoadingNotifications(true);
        
        // Fetch unread notifications count
        const notifResponse = await fetch('/api/notifications?unreadOnly=true&limit=50');
        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          if (notifData.success) {
            setUnreadCount(notifData.unreadCount || 0);
            setUserNotifications(notifData.notifications || []);
          }
        }

        // Fetch unread messages count
        const msgResponse = await fetch('/api/messages/unread-count');
        if (msgResponse.ok) {
          const msgData = await msgResponse.json();
          if (msgData.success) {
            setUnreadMessages(msgData.count || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      } finally {
        setLoadingUnread(false);
        setLoadingMessages(false);
        setLoadingNotifications(false);
      }
    }

    if (mounted && (isAuthenticated || session)) {
      fetchUnreadCounts();
      interval = setInterval(fetchUnreadCounts, 30000); // Update every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mounted, isAuthenticated, session]);

  // Load profile (image/name/email) and subscribe to updates so the header reflects uploads immediately
  useEffect(() => {
    if (!mounted || !(isAuthenticated || session)) return;
    let unsubscribe = () => {};
    (async () => {
      try {
        const data = await profileService.fetchProfile();
        if (data) setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    })();
    unsubscribe = profileService.onProfileUpdate((p) => setProfile(p));
    return unsubscribe;
  }, [mounted, isAuthenticated, session]);

  // Close dropdowns when clicking outside (profile handled by Radix)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Facebook-style navigation items
  const navigationItems = [
    { icon: Home, path: '/dashboard', label: 'Home', active: pathname === '/dashboard' },
    { icon: Users, path: '/social', label: 'Social', active: pathname.startsWith('/social') && !pathname.startsWith('/social/reels') && !pathname.startsWith('/social/discovery') },
    { icon: Video, path: '/social/reels', label: 'Reels', active: pathname.startsWith('/social/reels') },
    { icon: TrendingUp, path: '/social/discovery', label: 'Discovery', active: pathname.startsWith('/social/discovery') },
    { icon: Store, path: '/marketplace', label: 'Marketplace', active: pathname.startsWith('/marketplace') },
    { icon: Gamepad2, path: '/games', label: 'Games', active: pathname.startsWith('/games') }
  ];

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full px-4">
          <div className="flex items-center justify-between h-14">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="hidden md:flex space-x-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-28 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="flex space-x-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-full px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left Section - Logo and Search */}
          <div className="flex items-center space-x-2 flex-1 max-w-xs">
            <Link href="/dashboard" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
            </Link>
            
            {/* Search Bar */}
            <div className="hidden md:flex relative flex-1 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search MLM-Pak"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-100 border-0 rounded-full h-10 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Center Section - Navigation Icons */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md">
            <nav className="flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`relative flex items-center justify-center w-28 h-12 rounded-lg transition-colors ${
                      item.active
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={item.label}
                  >
                    <Icon className="h-6 w-6" />
                    {item.active && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-lg" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Section - Actions and Profile */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-1 justify-end max-w-xs">
            {/* Mobile Search */}
            <button
              aria-label="Open search"
              className="md:hidden p-2 sm:p-3 rounded-full hover:bg-gray-100 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            
            {(isAuthenticated || session) ? (
              <div className="flex items-center space-x-1">
                {/* Messages */}
                <div className="relative" ref={messagesRef}>
                  <button
                    aria-label="Open messages"
                    onClick={() => {
                      setShowMessages(!showMessages);
                      setShowNotifications(false);
                    }}
                    className="relative p-2 sm:p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <MessageSquare className="h-5 w-5 text-gray-700" />
                    {unreadMessages > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0 min-w-[16px]"
                      >
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </Badge>
                    )}
                  </button>

                  {showMessages && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Messages</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {loadingMessages ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          </div>
                        ) : userNotifications.filter(n => n.type === 'message').length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {userNotifications.filter(n => n.type === 'message').slice(0, 5).map((message) => (
                              <div key={message.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleNotificationClick(message)}>
                                <div className="flex items-start space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={`/api/placeholder/32/32`} />
                                    <AvatarFallback>U</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {message.title}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                      {message.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(message.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {!message.isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">No messages yet</p>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 border-t border-gray-200">
                        <button
                          onClick={() => handleLinkClick('/messages')}
                          className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          View All Messages
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    aria-label="Open notifications"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowMessages(false);
                    }}
                    className="relative p-2 sm:p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Bell className="h-5 w-5 text-gray-700" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0 min-w-[16px]"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          </div>
                        ) : userNotifications.length > 0 ? (
                          <div className="divide-y divide-gray-100">
                            {userNotifications.slice(0, 10).map((notification) => (
                              <div 
                                key={notification.id} 
                                className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`p-2 rounded-full ${
                                    notification.type === 'message' ? 'bg-blue-100' :
                                    notification.type === 'like' ? 'bg-red-100' :
                                    notification.type === 'comment' ? 'bg-green-100' :
                                    notification.type === 'follow' ? 'bg-purple-100' : 'bg-gray-100'
                                  }`}>
                                    {notification.type === 'message' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                                    {notification.type === 'like' && <Heart className="h-4 w-4 text-red-600" />}
                                    {notification.type === 'comment' && <MessageCircle className="h-4 w-4 text-green-600" />}
                                    {notification.type === 'follow' && <UserPlus className="h-4 w-4 text-purple-600" />}
                                    {!['message', 'like', 'comment', 'follow'].includes(notification.type) && <Bell className="h-4 w-4 text-gray-600" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notification.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">No notifications yet</p>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 border-t border-gray-200">
                        <div className="space-y-2">
                          <button
                            onClick={markAllAsRead}
                            className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Mark All as Read
                          </button>
                          <button
                            onClick={() => handleLinkClick('/notifications')}
                            className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            View All Notifications
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Menu - Radix Dropdown for reliability */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button aria-label="Open profile menu" className="flex items-center space-x-1 p-1 rounded-full hover:bg-gray-100 transition-colors">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center">
                        {profile?.image ? (
                          <img src={profile.image} alt={(profile?.name || userName || 'User') as string} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(profile?.name || session?.user?.name || userName || 'U').toString().charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      side="bottom"
                      sideOffset={8}
                      align="end"
                      collisionPadding={8}
                      className="w-64 max-w-[90vw] bg-white rounded-lg shadow-lg border border-gray-200 z-[70]"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center">
                            {profile?.image ? (
                              <img src={profile.image} alt={(profile?.name || userName || 'User') as string} className="w-full h-full object-cover" />
                            ) : (
                              <span>{(profile?.name || session?.user?.name || userName || 'U').toString().charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {profile?.name || session?.user?.name || userName || 'User'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {profile?.email || session?.user?.email || ''}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <DropdownMenu.Item
                          onSelect={() => handleLinkClick('/social/profile/' + (session?.user?.id || userId || ''))}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 outline-none cursor-pointer"
                        >
                          <User className="h-4 w-4 mr-3" />
                          <span>View Profile</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => handleLinkClick('/settings')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 outline-none cursor-pointer"
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          <span>Settings</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={toggleTheme}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 outline-none cursor-pointer"
                        >
                          {isDark ? <Sun className="h-4 w-4 mr-3" /> : <Moon className="h-4 w-4 mr-3" />}
                          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                        </DropdownMenu.Item>
                        <div className="border-t border-gray-200 my-2" />
                        <DropdownMenu.Item
                          onSelect={() => signOut({ callbackUrl: '/auth/login' })}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 outline-none cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          <span>Sign Out</span>
                        </DropdownMenu.Item>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => handleLinkClick('/auth/signin')}>
                  Sign In
                </Button>
                <Button onClick={() => handleLinkClick('/auth/signup')}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search MLM-Pak"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-100 border-0 rounded-full h-10"
                />
              </div>

              {/* Mobile Navigation */}
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      item.active
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
