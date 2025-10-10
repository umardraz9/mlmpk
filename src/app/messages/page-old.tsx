'use client';

// This file redirects to the optimized messages page with all WhatsApp-like features
import MessagesPageOptimized from './page-optimized';

export default MessagesPageOptimized;

interface UserType {
  id: string;
  name: string;
  email: string;
  image?: string;
}

function MessagesContent() {
  // Redirect to mobile-optimized version on mobile devices
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      // Use mobile-optimized interface
      window.location.href = '/messages/mobile';
    }
  }, []);
  
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showContextMenu, setShowContextMenu] = useState<{messageId: string, x: number, y: number} | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [starredMessages, setStarredMessages] = useState<string[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState<{messageId: string, content: string} | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on component mount and handle URL parameters
  useEffect(() => {
    if (session?.user && (session.user as any).id) {
      loadConversations();
      loadAllUsers();
      
      // Check if there's a user parameter in the URL
      const userId = searchParams.get('user');
      if (userId) {
        setSelectedConversation(userId);
      }
    }
  }, [session, searchParams]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && session?.user && (session.user as any).id) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, session]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('📡 Loading conversations for user:', (session?.user as any)?.id);
      const response = await fetch('/api/messages/conversations', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Conversations API response:', data);
        if (data.success && data.conversations) {
          // Ensure proper conversation structure
          const formattedConversations = data.conversations.map((conv: any) => ({
            id: conv.id,
            otherUser: {
              id: conv.otherUser.id,
              name: conv.otherUser.name || conv.otherUser.email?.split('@')[0] || 'Unknown User',
              image: conv.otherUser.image
            },
            lastMessage: conv.lastMessage?.content || 'No messages yet',
            lastMessageTime: conv.lastMessage?.createdAt,
            unreadCount: conv.unreadCount || 0,
            messages: conv.messages || []
          }));
          setConversations(formattedConversations);
          console.log('✅ Loaded conversations:', formattedConversations.length);
        }
      } else {
        console.error('❌ Failed to load conversations:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter out current user
          const otherUsers = data.users.filter((user: UserType) => user.id !== (session?.user as any)?.id);
          setAllUsers(otherUsers);
          console.log('✅ Loaded users:', otherUsers.length);
        }
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      console.log('📨 Loading messages for user:', userId);
      const response = await fetch(`/api/messages/${userId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Messages API response:', data);
        if (data.success && data.messages) {
          setMessages(data.messages);
          console.log('✅ Loaded messages:', data.messages.length);
        } else {
          setMessages([]);
        }
      } else {
        console.error('❌ Failed to load messages:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedConversation || sending) return;

    setSending(true);
    try {
      let imageUrls: string[] = [];
      
      // Upload images if any
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((file, index) => {
          formData.append(`images`, file);
        });
        
        const uploadResponse = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrls = uploadData.urls || [];
        }
      }

      const endpoint = replyingTo ? '/api/messages/reply' : '/api/messages/send-enhanced';
      const payload = replyingTo 
        ? {
            messageId: replyingTo.id,
            content: newMessage.trim(),
            images: imageUrls
          }
        : {
            recipientId: selectedConversation,
            content: newMessage.trim(),
            images: imageUrls
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newMsg: Message = {
            ...data.message,
            sender: {
              ...data.message.sender,
              name: data.message.sender.name || session?.user?.name || 'You'
            },
            recipient: {
              ...data.message.recipient,
              name: data.message.recipient.name || 'Unknown User'
            }
          };
          setMessages(prev => [...prev, newMsg]);
          setNewMessage('');
          setSelectedImages([]);
          setImagePreview([]);
          setReplyingTo(null);
          loadConversations();
        } else {
          alert('Failed to send message: ' + data.error);
        }
      } else {
        const errorData = await response.json();
        alert('Failed to send message: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Network error. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = (userId: string) => {
    setSelectedConversation(userId);
    setShowNewChat(false);
    setMessages([]); // Start with empty messages
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleEditSave();
      } else {
        sendMessage();
      }
    }
    if (e.key === 'Escape') {
      setReplyingTo(null);
      setEditingMessage(null);
      setEditContent('');
      setShowContextMenu(null);
      setShowReactionPicker(null);
      setShowEmojiPicker(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleMessageRightClick = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setShowContextMenu({
      messageId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleLongPressStart = (messageId: string) => {
    const timer = setTimeout(() => {
      setShowContextMenu({
        messageId,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      });
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const closeContextMenu = () => {
    setShowContextMenu(null);
    setShowReactionPicker(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };
    
    if (showContextMenu || showReactionPicker || showEmojiPicker) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu, showReactionPicker, showEmojiPicker]);

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch('/api/messages/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const existingReaction = msg.reactions?.find(r => r.user.id === (session?.user as any)?.id);
            if (existingReaction) {
              return {
                ...msg,
                reactions: msg.reactions?.map(r => 
                  r.user.id === (session?.user as any)?.id ? data.reaction : r
                )
              };
            } else {
              return {
                ...msg,
                reactions: [...(msg.reactions || []), data.reaction]
              };
            }
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleEditStart = (message: Message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  const handleEditSave = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      const response = await fetch(`/api/messages/message/${editingMessage}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage ? data.updatedMessage : msg
        ));
        setEditingMessage(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDelete = async (messageId: string, type: 'soft' | 'hard' = 'soft') => {
    try {
      const response = await fetch(`/api/messages/message/${messageId}?type=${type}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (type === 'hard') {
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
        } else {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isDeleted: true } : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleForward = (messageId: string, content: string) => {
    setShowForwardModal({ messageId, content });
    closeContextMenu();
  };

  const handleForwardToUsers = async (messageId: string, recipientIds: string[]) => {
    try {
      const response = await fetch('/api/messages/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, recipientIds })
      });

      if (response.ok) {
        alert('Message forwarded successfully!');
        setShowForwardModal(null);
      } else {
        alert('Failed to forward message');
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Error forwarding message');
    }
  };

  const handleStar = (messageId: string) => {
    setStarredMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
    closeContextMenu();
  };

  const handlePin = (messageId: string) => {
    setPinnedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
    closeContextMenu();
  };

  const handleSelect = (messageId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedMessages([messageId]);
    } else {
      setSelectedMessages(prev => 
        prev.includes(messageId)
          ? prev.filter(id => id !== messageId)
          : [...prev, messageId]
      );
    }
    closeContextMenu();
  };

  const handleShare = async (content: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Shared Message',
          text: content
        });
      } else {
        await navigator.clipboard.writeText(content);
        alert('Message copied to clipboard for sharing!');
      }
    } catch (error) {
      console.error('Error sharing message:', error);
      alert('Error sharing message');
    }
    closeContextMenu();
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedMessages([]);
  };

  const handleBlock = async (userId: string) => {
    try {
      const response = await fetch('/api/messages/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: userId })
      });

      if (response.ok) {
        setBlockedUsers(prev => [...prev, userId]);
        alert('User blocked successfully');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.type === 'message' && notification.senderId) {
      setSelectedConversation(notification.senderId);
      setShowNotifications(false);
      
      // Mark notification as read
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      
      // Update notification count
      setNotificationCount(prev => Math.max(0, prev - 1));
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNotifications = notifications.filter(notification => 
    !notification.read
  );

  const selectedConversationData = conversations.find(conv => conv.id === selectedConversation)?.otherUser ||
    allUsers.find(user => user.id === selectedConversation);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access messages.</p>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
              <p className="text-gray-600">Connect with your team and network</p>
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
              
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selection Mode Header */}
        {isSelectionMode && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-blue-800 font-medium">{selectedMessages.length} selected</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Delete selected messages
                  selectedMessages.forEach(id => handleDelete(id));
                  exitSelectionMode();
                }}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={exitSelectionMode}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-0 lg:gap-6 h-screen lg:h-[600px]">
          {/* Conversations List - Mobile: Hidden when conversation selected */}
          <Card className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : 'flex-1 lg:flex-none'} lg:h-auto h-full`}>
            <CardHeader className="pb-2 px-4 py-3 bg-green-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Chats</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowNewChat(true)}
                  className="bg-green-700 hover:bg-green-800 h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Start a new chat to begin messaging</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv.id);
                        loadMessages(conv.id);
                      }}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                        selectedConversation === conv.id ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            {conv.otherUser.image ? (
                              <img src={conv.otherUser.image} alt={conv.otherUser.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <User className="h-6 w-6 text-green-600" />
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 truncate text-base">{conv.otherUser.name}</h4>
                            <div className="flex items-center gap-1">
                              <p className="text-xs text-gray-400">
                                {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ''}
                              </p>
                              {conv.unreadCount > 0 && (
                                <div className="bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-1">
                                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate flex-1">
                              {(() => {
                                let messageText = '';
                                if (typeof conv.lastMessage === 'string') {
                                  messageText = conv.lastMessage;
                                } else if (conv.lastMessage?.content) {
                                  messageText = conv.lastMessage.content;
                                } else {
                                  messageText = 'No messages yet';
                                }
                                return messageText.length > 40 ? messageText.substring(0, 40) + '...' : messageText;
                              })()}
                            </p>
                            <div className="flex items-center gap-1 ml-2">
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        {selectedConversationData?.image ? (
                          <img
                            src={selectedConversationData.image}
                            alt={selectedConversationData.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversationData?.name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
                      >
                        <Image className="h-5 w-5" />
                      </label>
                      
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEmojiPicker(!showEmojiPicker);
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                        
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                          <div className="absolute bottom-12 left-0 bg-white border rounded-lg shadow-lg p-4 z-50 w-64">
                            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                              {[
                                '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                                '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                                '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                                '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                                '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                                '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                                '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                                '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
                                '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
                                '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
                                '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
                                '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
                                '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
                                '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️',
                                '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
                                '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
                                '💝', '💟', '👍', '👎', '👌', '🤌', '🤏', '✌️',
                                '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
                                '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
                                '🙌', '🤝', '👐', '🤲', '🤜', '🤛', '✊', '👊'
                              ].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => insertEmoji(emoji)}
                                  className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  </CardHeader>
                  <CardContent>
                  {/* Messages Area */}
                  <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.filter(msg => !msg.isDeleted).map((message) => {
                        const isCurrentUser = message.senderId === (session.user as any)?.id;
                        const isEditing = editingMessage === message.id;
                        const isStarred = starredMessages.includes(message.id);
                        const isPinned = pinnedMessages.includes(message.id);
                        const isSelected = selectedMessages.includes(message.id);
                        return (
                          <div
                            key={message.id}
                            className={`group flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isSelected ? 'bg-blue-50' : ''} ${isPinned ? 'border-l-4 border-blue-500 pl-2' : ''}`}
                            onContextMenu={(e) => handleMessageRightClick(e, message.id)}
                            onTouchStart={() => handleLongPressStart(message.id)}
                            onTouchEnd={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                          >
                            <div className="relative max-w-xs lg:max-w-md">
                              {/* Selection checkbox */}
                              {isSelectionMode && (
                                <div className="absolute -left-8 top-2 z-10">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelect(message.id)}
                                    className="rounded"
                                  />
                                </div>
                              )}
                              
                              {/* Star indicator */}
                              {isStarred && (
                                <div className="absolute -top-2 -right-2 text-yellow-500 text-xs">
                                  ⭐
                                </div>
                              )}
                              
                              {/* Reply indicator */}
                              {message.replyTo && (
                                <div className="mb-1 text-xs text-gray-500 px-2">
                                  <Reply className="h-3 w-3 inline mr-1" />
                                  Replying to: {message.replyTo.content.substring(0, 30)}...
                                </div>
                              )}
                              
                              <div
                                className={`px-4 py-2 rounded-lg ${
                                  isCurrentUser 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="w-full px-2 py-1 text-sm bg-white text-black rounded"
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleEditSave}
                                        className="text-xs px-2 py-1 bg-green-600 text-white rounded"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingMessage(null);
                                          setEditContent('');
                                        }}
                                        className="text-xs px-2 py-1 bg-gray-500 text-white rounded"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {message.content && (
                                      <p className="text-sm">{message.content}</p>
                                    )}
                                    
                                    {/* Image attachments */}
                                    {(() => {
                                      const images = typeof message.images === 'string' 
                                        ? JSON.parse(message.images || '[]') 
                                        : (message.images || []);
                                      return images.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                          {images.map((imageUrl: string, index: number) => (
                                            <img
                                              key={index}
                                              src={imageUrl}
                                              alt="Attachment"
                                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                                              onClick={() => window.open(imageUrl, '_blank')}
                                            />
                                          ))}
                                        </div>
                                      );
                                    })()}
                                    
                                    {message.isEdited && (
                                      <span className="text-xs opacity-60">(edited)</span>
                                    )}
                                  </>
                                )}
                                
                                {/* Reactions */}
                                {message.reactions && message.reactions.length > 0 && (
                                  <div className="flex gap-1 mt-2">
                                    {message.reactions.map((reaction) => (
                                      <span
                                        key={reaction.id}
                                        className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full"
                                      >
                                        {reaction.emoji}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="text-xs opacity-60 mt-1">
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                  {isCurrentUser && (
                                    <span className="ml-2">
                                      <CheckCheck className="h-3 w-3 inline" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    {/* Reply indicator */}
                    {replyingTo && (
                      <div className="mb-2 p-2 bg-gray-100 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Reply className="h-4 w-4" />
                            <span>Replying to: {replyingTo.content.substring(0, 50)}...</span>
                          </div>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Image Preview */}
                    {imagePreview.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {imagePreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
                      >
                        <Image className="h-5 w-5" />
                      </label>
                      
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEmojiPicker(!showEmojiPicker);
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                        
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                          <div className="absolute bottom-12 left-0 bg-white border rounded-lg shadow-lg p-4 z-50 w-64">
                            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                              {[
                                '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                                '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                                '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                                '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                                '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                                '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                                '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                                '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
                                '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
                                '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
                                '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
                                '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
                                '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
                                '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️',
                                '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
                                '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
                                '💝', '💟', '👍', '👎', '👌', '🤌', '🤏', '✌️',
                                '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
                                '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
                                '🙌', '🤝', '👐', '🤲', '🤜', '🤛', '✊', '👊'
                              ].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => insertEmoji(emoji)}
                                  className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={selectedImages.length > 0 ? "Add a caption..." : "Type a message..."}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={sending}
                      />
                      
                      <Button
                        onClick={sendMessage}
                        disabled={(!newMessage.trim() && selectedImages.length === 0) || sending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </> 
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Choose a conversation from the list to start messaging
                    </p>
                    <Button
                      onClick={() => setShowNewChat(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Start New Chat
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
        </div>

        {/* New Chat Modal */}
        {showNewChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 max-h-96">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Start New Chat</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewChat(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => startNewConversation(user.id)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Messages...</h2>
          <p className="text-gray-500">Please wait while we load your conversations</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}


