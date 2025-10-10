'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { profileService, type ProfileData } from '@/lib/profile-service';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { 
  MessageSquare, 
  User, 
  LogOut, 
  Search, 
  ShoppingCart, 
  Heart, 
  X, 
  FileText,
  Package,
  CheckCircle,
  Shield,
  Mail,
  ChevronDown,
  Bell,
  Home,
  ShoppingBag,
  Users,
  Settings
} from 'lucide-react';

interface HeaderProps {
  isAuthenticated?: boolean;
  userName?: string;
  isAdmin?: boolean;
  userId?: string;
}

export default function Header({ isAuthenticated = false, userName, isAdmin = false, userId }: HeaderProps) {
  const { isDark } = useTheme();
  const { cartCount } = useCart();
  const router = useRouter();
  
  // State management
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
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
  const [messageNotifications, setMessageNotifications] = useState<any[]>([]);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null);

  // Handle navigation
  const handleLinkClick = (path: string) => {
    router.push(path);
    setShowNotifications(false);
    setShowMessages(false);
    setShowFavorites(false);
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark notification as read
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH'
      });

      // Use actionUrl if available, otherwise fallback to type-based routing
      let redirectUrl = notification.actionUrl;
      
      if (!redirectUrl) {
        // Fallback routing logic
        if (notification.type === 'message') {
          const data = notification.data ? JSON.parse(notification.data) : {};
          const senderId = data.senderId || notification.createdById;
          redirectUrl = `/messages?userId=${senderId}`;
        } else if (notification.type === 'event') {
          const data = notification.data ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) : {};
          const postId = data.postId;
          
          if (data.kind === 'POST_COMMENT' || notification.title?.includes('comment')) {
            redirectUrl = postId ? `/social?postId=${postId}` : '/social';
          } else if (data.kind === 'POST_LIKE' || notification.title?.includes('like')) {
            redirectUrl = postId ? `/social?postId=${postId}` : '/social';
          } else if (data.kind === 'POST_SHARE' || notification.title?.includes('shared')) {
            redirectUrl = postId ? `/social?postId=${postId}` : '/social';
          } else {
            redirectUrl = '/social';
          }
        } else if (notification.type === 'follow' || notification.type === 'friend_request') {
          const senderId = notification.createdById;
          redirectUrl = `/social/profile/${senderId}`;
        } else {
          redirectUrl = '/notifications';
        }
      }

      console.log('🔗 Navigating to:', redirectUrl);
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
          // Update local state to mark all notifications as read
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

  // Load profile (image/name/email) for header avatar and subscribe to updates
  useEffect(() => {
    if (!mounted) return;
    let unsubscribe = () => {};
    (async () => {
      try {
        const data = await profileService.fetchProfile();
        if (data) setProfile(data);
      } catch {}
    })();
    unsubscribe = profileService.onProfileUpdate((p) => setProfile(p));
    return unsubscribe;
  }, [mounted, isAuthenticated]);

  // Fetch unread notifications and messages count periodically when authenticated
  useEffect(() => {
    let interval: any;
    async function fetchUnreadCounts() {
      if (!isAuthenticated) return;
      try {
        setLoadingUnread(true);
        setLoadingMessages(true);
        setLoadingNotifications(true);
        
        // Fetch actual notifications with details for display (force no cache)
        const notifRes = await fetch(`/api/notifications/display?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (notifData.success) {
            setUserNotifications(notifData.notifications || []);
            setUnreadCount(notifData.unreadCount || 0);
            console.log('📬 Fetched notifications:', {
              count: notifData.notifications?.length || 0,
              unread: notifData.unreadCount || 0,
              latest: notifData.notifications?.[0]?.title || 'none'
            });
          }
        }
        
        // Fetch message notifications
        const msgRes = await fetch(`/api/messages/notifications`, { cache: 'no-store' });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          if (msgData.success) {
            setMessageNotifications(msgData.messages || []);
            setUnreadMessages(msgData.unreadCount || 0);
          }
        } else {
          // Fallback: Reset to 0 if API fails
          setUnreadMessages(0);
          setMessageNotifications([]);
        }
        
        // Fetch favorites count
        const favRes = await fetch(`/api/favorites?limit=1`, { cache: 'no-store' });
        if (favRes.ok) {
          const favData = await favRes.json();
          if (Array.isArray(favData?.favorites)) setFavoritesCount(favData.favorites.length);
        }
        
      } catch {
        // ignore
      } finally {
        setLoadingUnread(false);
        setLoadingMessages(false);
      }
    }
    fetchUnreadCounts();
    interval = setInterval(fetchUnreadCounts, 5000);
    return () => interval && clearInterval(interval);
  }, [isAuthenticated]);


  
  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!mounted) return;
    
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
      if (favoritesRef.current && !favoritesRef.current.contains(event.target as Node)) {
        setShowFavorites(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mounted]);
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Products', href: '/products', icon: ShoppingBag },
    { name: 'Blog', href: '/blog', icon: FileText },
    { name: 'Cart', href: '/cart', icon: ShoppingCart },
    { name: 'Orders', href: '/orders', icon: Package },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Social', href: '/social', icon: MessageSquare },
    { name: 'Tasks', href: '/tasks', icon: CheckCircle },
    { name: 'Profile', href: userId ? `/social/profile/${userId}` : '/social/profile', icon: User },
  ];

  // removed unused adminNavigation

  // NO hardcoded demo data - only use real data from database via userNotifications and messageNotifications

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/auth/login' });
    } catch (e) {
      // Fallback redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  };



  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    } border-b`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className={`font-bold text-xl ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>MCNmart</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section - Actions and Profile */}
          <div className="flex items-center space-x-2 flex-1 justify-end max-w-full md:max-w-xs">
            {/* Mobile Search */}
            <button className="md:hidden p-2 rounded-full hover:bg-gray-100" aria-label="Open search">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Shopping Cart */}
                <div className="relative">
                  <button
                    aria-label="Open cart"
                    onClick={() => handleLinkClick('/cart')}
                    className={`relative p-2 rounded-full transition-colors ${
                      isDark 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {Math.min(cartCount, 99)}
                      </span>
                    )}
                  </button>
                </div>
                {/* Favorites Dropdown */}
                <div className="relative" ref={favoritesRef}>
                  <button
                    aria-label="Open favorites"
                    onClick={() => {
                      setShowFavorites(!showFavorites);
                      setShowMessages(false);
                      setShowNotifications(false);
                    }}
                    className={`relative p-2 rounded-full transition-colors ${
                      isDark 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className="h-5 w-5" />
                    {favoritesCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {Math.min(favoritesCount, 99)}
                      </span>
                    )}
                  </button>

                  {mounted && showFavorites && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg z-50 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } border`}>
                      <div className={`px-4 py-3 border-b ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`text-lg font-semibold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>Favorites</h3>
                          <button
                            onClick={() => setShowFavorites(false)}
                            className={`p-1 rounded-full ${
                              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            <X className={`h-4 w-4 ${
                              isDark ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {favoritesCount === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Heart className={`h-12 w-12 mx-auto mb-3 ${
                              isDark ? 'text-gray-600' : 'text-gray-400'
                            }`} />
                            <p className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>No favorites yet</p>
                            <p className={`text-xs ${
                              isDark ? 'text-gray-500' : 'text-gray-400'
                            } mt-1`}>Start favoriting profiles and content!</p>
                          </div>
                        ) : (
                          <div className="px-4 py-3">
                            <p className={`text-sm ${
                              isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}>You have {favoritesCount} favorite{favoritesCount !== 1 ? 's' : ''}</p>
                          </div>
                        )}
                      </div>
                      <div className={`px-4 py-3 border-t ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleLinkClick('/favorites')}
                            className="block w-full text-center bg-pink-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors"
                          >
                            View All Favorites
                          </button>
                          <button
                            onClick={() => handleLinkClick('/social')}
                            className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            Social Hub
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications Dropdown (shared) */}
                <div className="relative" ref={notificationsRef}>
                  <NotificationCenter className="ml-1" />
                </div>

                {/* Messages Dropdown */}
                <div className="relative" ref={messagesRef}>
                  <button
                    aria-label="Open messages"
                    onClick={() => {
                      setShowMessages(!showMessages);
                      setShowNotifications(false);
                    }}
                    className={`relative p-2 rounded-full transition-colors ${
                      isDark 
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Mail className="h-5 w-5" />
                    {(unreadMessages > 0 || messageNotifications.length > 0) && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {isAuthenticated ? (loadingMessages ? '…' : Math.min(unreadMessages || messageNotifications.length, 99)) : messageNotifications.length}
                      </span>
                    )}
                  </button>

                  {mounted && showMessages && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg z-50 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } border`}>
                      <div className={`px-4 py-3 border-b ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`text-lg font-semibold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>Messages</h3>
                          <button
                            onClick={() => setShowMessages(false)}
                            className={`p-1 rounded-full ${
                              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            <X className={`h-4 w-4 ${
                              isDark ? 'text-gray-300' : 'text-gray-600'
                            }`} />
                          </button>
                        </div>
                      </div>
                       <div className="max-h-64 overflow-y-auto">
                        {loadingMessages ? (
                          <div className="px-4 py-8 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>Loading messages...</p>
                          </div>
                        ) : messageNotifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Mail className={`h-12 w-12 mx-auto mb-3 ${
                              isDark ? 'text-gray-600' : 'text-gray-400'
                            }`} />
                            <p className={`text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>No messages yet</p>
                            <p className={`text-xs ${
                              isDark ? 'text-gray-500' : 'text-gray-400'
                            } mt-1`}>Send a test message to see it here!</p>
                          </div>
                        ) : (
                          messageNotifications.map((message) => (
                            <div key={message.id} className={`px-4 py-3 border-b last:border-b-0 hover:bg-opacity-50 transition-colors ${
                              isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                            } ${!message.isRead ? (isDark ? 'bg-blue-900/10' : 'bg-blue-50/50') : ''}`}>
                              <div className="flex items-start space-x-3">
                                <img 
                                  src={message.senderAvatar} 
                                  alt={message.sender}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className={`text-sm font-medium ${
                                      isDark ? 'text-white' : 'text-gray-900'
                                    }`}>{message.sender}</p>
                                    {!message.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <p className={`text-sm ${
                                    isDark ? 'text-gray-300' : 'text-gray-600'
                                  }`} style={{ wordBreak: 'break-word' }}>{message.content}</p>
                                  <p className={`text-xs ${
                                    isDark ? 'text-gray-400' : 'text-gray-500'
                                  } mt-1`}>{message.timeAgo}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className={`px-4 py-3 border-t ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleLinkClick('/messages')}
                            className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            View All Messages
                          </button>
                          <button
                            onClick={() => handleLinkClick('/social')}
                            className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            Social Hub
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                {/* Profile Dropdown - Radix for reliable interactions */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      aria-label="Open profile menu"
                      className={`flex items-center space-x-2 p-2 rounded-full transition-colors ${
                        isDark 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
                        {profile?.image ? (
                          <img src={profile.image} alt={(profile?.name || userName || 'User') as string} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-medium text-sm">
                            {(profile?.name || userName || 'U').toString().charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      side="bottom"
                      sideOffset={8}
                      align="end"
                      collisionPadding={8}
                      className={`mt-2 w-64 max-w-[90vw] rounded-md shadow-lg z-[70] border ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* User Profile Section */}
                      <div className={`px-4 py-3 border-b ${
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
                            {profile?.image ? (
                              <img src={profile.image} alt={(profile?.name || userName || 'User') as string} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-medium">
                                {(profile?.name || userName || 'U').toString().charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>{profile?.name || userName || 'User'}</p>
                            <p className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>{profile?.email || ''}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="py-2">
                        <DropdownMenu.Item
                          onSelect={() => handleLinkClick(userId ? `/social/profile/${userId}` : '/profile')}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm w-full text-left outline-none cursor-pointer ${
                            isDark 
                              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <User className="h-4 w-4" />
                          <span>View Profile</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          onSelect={() => handleLinkClick('/settings')}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm w-full text-left outline-none cursor-pointer ${
                            isDark 
                              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Account Settings</span>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          onSelect={() => handleLinkClick('/favorites')}
                          className={`flex items-center space-x-3 px-4 py-2 text-sm w-full text-left outline-none cursor-pointer ${
                            isDark 
                              ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <Heart className="h-4 w-4" />
                          <span>Favorites</span>
                        </DropdownMenu.Item>

                        {isAdmin && (
                          <DropdownMenu.Item
                            onSelect={() => handleLinkClick('/admin')}
                            className={`flex items-center space-x-3 px-4 py-2 text-sm w-full text-left outline-none cursor-pointer ${
                              isDark 
                                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <Shield className="h-4 w-4" />
                            <span>Admin Panel</span>
                          </DropdownMenu.Item>
                        )}

                        <div className={`border-t ${
                          isDark ? 'border-gray-700' : 'border-gray-200'
                        } mt-2 pt-2`}>
                          <DropdownMenu.Item
                            onSelect={handleLogout}
                            className={`flex items-center space-x-3 px-4 py-2 text-sm w-full text-left outline-none cursor-pointer text-red-600 hover:bg-red-50 ${
                              isDark ? 'hover:bg-red-900/20' : ''
                            }`}
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                          </DropdownMenu.Item>
                        </div>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 