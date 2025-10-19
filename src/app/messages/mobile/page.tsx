'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  MessageSquare, 
  Send, 
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Users,
  ArrowLeft,
  Plus,
  User,
  Clock,
  Loader2,
  Bell,
  X,
  MessageSquarePlus,
  Reply,
  Edit,
  Trash2,
  Forward,
  Heart,
  ThumbsUp,
  Laugh,
  UserX,
  MoreHorizontal,
  Copy,
  Star,
  Pin,
  Share,
  Image,
  Camera,
  Menu
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  messageType: 'text' | 'media';
  attachments?: string;
  images?: string[];
  replyToId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  editedAt?: string;
  deletedAt?: string;
  reactions?: {
    id: string;
    emoji: string;
    user: {
      id: string;
      name: string;
    };
  }[];
  replyTo?: {
    id: string;
    content: string;
    sender: {
      name: string;
    };
  };
  sender: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  image?: string;
  lastMessage: string | Message;
  lastMessageTime?: string;
  unreadCount: number;
}

function MobileMessagesContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedConversationData, setSelectedConversationData] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentView, setCurrentView] = useState<'chats' | 'conversation'>('chats');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{message: Message, x: number, y: number} | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on component mount
  useEffect(() => {
    if (session?.user && (session.user as any).id) {
      loadConversations();
      loadAllUsers();
    }
  }, [session]);

  const loadConversations = async () => {
    try {
      console.log('📱 Loading conversations...');
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Conversations response:', data);
        
        if (data.success && data.conversations) {
          // Transform conversations to match expected format
          const formattedConversations = data.conversations.map((conv: any) => ({
            id: conv.id,
            name: conv.otherUser?.name || conv.otherUser?.email?.split('@')[0] || 'Unknown User',
            image: conv.otherUser?.image,
            lastMessage: conv.lastMessage?.content || 'No messages yet',
            lastMessageTime: conv.lastMessage?.createdAt,
            unreadCount: conv.unreadCount || 0
          }));
          
          setConversations(formattedConversations);
          console.log('✅ Loaded conversations:', formattedConversations.length);
        } else {
          console.log('⚠️ No conversations found');
          setConversations([]);
        }
      } else {
        console.error('❌ Failed to load conversations:', response.status);
        setConversations([]);
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      setConversations([]);
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
          const otherUsers = data.users.filter((user: any) => user.id !== (session?.user as any)?.id);
          setAllUsers(otherUsers);
          console.log('✅ Loaded users:', otherUsers.length);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      console.log('📨 Loading messages for conversation:', conversationId);
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Messages response:', data);
        if (data.success && data.messages) {
          setMessages(data.messages);
          console.log('✅ Loaded messages:', data.messages.length);
        } else {
          setMessages([]);
        }
        
        // Find conversation data or create from user data
        let convData = conversations.find(c => c.id === conversationId);
        if (!convData) {
          const user = allUsers.find(u => u.id === conversationId);
          if (user) {
            convData = {
              id: user.id,
              name: user.name || user.email || 'Unknown User',
              image: user.image,
              lastMessage: 'No messages yet',
              lastMessageTime: '',
              unreadCount: 0
            };
          }
        }
        setSelectedConversationData(convData || null);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setCurrentView('conversation');
    loadMessages(conversationId);
  };

  const handleBackToChats = () => {
    setCurrentView('chats');
    setSelectedConversation(null);
    setSelectedConversationData(null);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedConversation || sending) return;

    setSending(true);
    try {
      let imageUrls: string[] = [];
      
      // Upload images if any
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((file) => {
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
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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

  const handleLongPressStart = (message: Message) => {
    const timer = setTimeout(() => {
      setShowContextMenu({
        message,
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

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch('/api/messages/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      });

      if (response.ok) {
        // Update message with reaction
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const existingReaction = msg.reactions?.find(r => r.user.id === (session?.user as any)?.id);
            if (existingReaction) {
              return {
                ...msg,
                reactions: msg.reactions?.map(r => 
                  r.user.id === (session?.user as any)?.id ? { ...r, emoji } : r
                )
              };
            } else {
              return {
                ...msg,
                reactions: [...(msg.reactions || []), {
                  id: Date.now().toString(),
                  emoji,
                  user: { id: (session?.user as any)?.id || '', name: session?.user?.name || '' }
                }]
              };
            }
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
    setShowContextMenu(null);
    setShowReactionPicker(null);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setShowContextMenu(null);
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('Message copied to clipboard');
    } catch (error) {
      console.error('Error copying message:', error);
    }
    setShowContextMenu(null);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please sign in</h2>
          <p className="text-gray-500">You need to be signed in to access messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-screen w-screen bg-gray-100 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* WhatsApp-style Mobile Interface */}
      
      {/* Chats List View */}
      {currentView === 'chats' && (
        <div className="h-full flex flex-col bg-white">
          {/* Header */}
          <div className="bg-green-600 text-white px-4 py-4 flex items-center justify-between shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 1rem)', paddingBottom: '1rem' }}>
            <h1 className="text-xl font-medium">MCNmart Messages</h1>
            <div className="flex items-center gap-6">
              <Search className="h-5 w-5" />
              <MoreVertical className="h-5 w-5" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 bg-gray-50 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-8">
                <MessageSquare className="h-20 w-20 mb-6 text-gray-300" />
                <p className="text-lg font-medium mb-2 text-center">No chats yet</p>
                <p className="text-sm text-center text-gray-400 leading-relaxed">Tap the message icon to start a new conversation with your contacts</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleConversationSelect(conv.id)}
                  className="flex items-center p-4 border-b border-gray-100 active:bg-gray-50 transition-colors touch-manipulation"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                      {conv.image ? (
                        <img src={conv.image} alt={conv.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-gray-600" />
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate text-base">{conv.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''}
                        </span>
                        {conv.unreadCount > 0 && (
                          <div className="bg-green-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-medium">
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
                          // Truncate to first 40 characters for better preview
                          return messageText.length > 40 ? messageText.substring(0, 40) + '...' : messageText;
                        })()}
                      </p>
                      <CheckCheck className="h-4 w-4 text-blue-500 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Floating Action Button */}
          <button
            onClick={() => setShowNewChat(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white active:bg-green-700 transition-colors z-50 touch-manipulation"
          >
            <MessageSquarePlus className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Conversation View */}
      {currentView === 'conversation' && selectedConversationData && (
        <div className="h-full flex flex-col bg-white">
          {/* Chat Header */}
          <div className="bg-green-600 text-white px-4 py-4 flex items-center gap-3 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 1rem)', paddingBottom: '1rem' }}>
            <button onClick={handleBackToChats} className="p-1 -ml-1 touch-manipulation">
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
              {selectedConversationData.image ? (
                <img src={selectedConversationData.image} alt={selectedConversationData.name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-gray-600" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-medium truncate text-base">{selectedConversationData.name}</h2>
              <p className="text-xs text-green-100">online</p>
            </div>
            
            <div className="flex items-center gap-5">
              <Video className="h-5 w-5 touch-manipulation" />
              <Phone className="h-5 w-5 touch-manipulation" />
              <MoreVertical className="h-5 w-5 touch-manipulation" />
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 bg-opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}>
            <div className="p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-base">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                </div>
              ) : (
                messages.filter(msg => !msg.isDeleted).map((message) => {
                  const isCurrentUser = message.senderId === (session.user as any)?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] px-3 py-2 rounded-lg relative ${
                          isCurrentUser 
                            ? 'bg-green-500 text-white rounded-br-sm shadow-sm' 
                            : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'
                        }`}
                        onTouchStart={() => handleLongPressStart(message)}
                        onTouchEnd={handleLongPressEnd}
                        onTouchCancel={handleLongPressEnd}
                      >
                        {message.content && (
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        )}
                        
                        {/* Reply indicator */}
                        {message.replyTo && (
                          <div className="mb-2 p-2 bg-black bg-opacity-10 rounded border-l-2 border-green-400">
                            <p className="text-xs opacity-75">{message.replyTo.sender.name}</p>
                            <p className="text-xs">{message.replyTo.content}</p>
                          </div>
                        )}

                        {message.content && (
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        )}
                        
                        {/* Image attachments */}
                        {(() => {
                          const images = typeof message.images === 'string' 
                            ? JSON.parse(message.images || '[]') 
                            : (message.images || []);
                          return images.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {images.map((imageUrl: string, index: number) => (
                                <img
                                  key={index}
                                  src={imageUrl}
                                  alt="Attachment"
                                  className="max-w-full h-auto rounded-lg cursor-pointer touch-manipulation"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              ))}
                            </div>
                          );
                        })()}

                        {/* Reactions */}
                        {(() => {
                          const reactions = typeof message.reactions === 'string' 
                            ? JSON.parse(message.reactions || '[]') 
                            : (message.reactions || []);
                          return reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {reactions.map((reaction: any, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 bg-gray-200 rounded-full text-xs"
                                >
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                        
                        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                          isCurrentUser ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          <span>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {message.isEdited && (
                            <span className="text-xs opacity-75">(edited)</span>
                          )}
                          {isCurrentUser && (
                            <CheckCheck className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Reply indicator */}
          {replyingTo && (
            <div className="px-4 py-3 bg-gray-100 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Replying to: {replyingTo.content.substring(0, 30)}...
                </span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="touch-manipulation">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview.length > 0 && (
            <div className="px-4 py-3 bg-gray-100 border-t">
              <div className="flex gap-2 overflow-x-auto">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs touch-manipulation"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 bg-white border-t flex items-end gap-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="p-2 text-gray-500 active:bg-gray-100 rounded-full touch-manipulation">
                <Paperclip className="h-5 w-5" />
              </label>
              
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-500 active:bg-gray-100 rounded-full touch-manipulation"
                >
                  <Smile className="h-5 w-5" />
                </button>
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 bg-white border rounded-lg shadow-lg p-3 z-50 w-64">
                    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                      {[
                        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                        '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                        '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                        '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                        '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                        '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                        '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
                        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                        '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
                        '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋'
                      ].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="text-lg p-2 hover:bg-gray-100 rounded transition-colors touch-manipulation"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 flex items-end gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={selectedImages.length > 0 ? "Add a caption..." : "Type a message"}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                disabled={sending}
              />
              
              <button
                onClick={sendMessage}
                disabled={(!newMessage.trim() && selectedImages.length === 0) || sending}
                className="p-3 bg-green-600 text-white rounded-full disabled:bg-gray-300 active:bg-green-700 transition-colors touch-manipulation"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Chat</h3>
              <button onClick={() => setShowNewChat(false)} className="touch-manipulation">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    handleConversationSelect(user.id);
                    setShowNewChat(false);
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation"
                >
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 m-4 w-80 max-w-full">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Message from {showContextMenu.message.sender.name}</p>
              <p className="text-sm bg-gray-100 p-2 rounded">{showContextMenu.message.content}</p>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setShowReactionPicker(showContextMenu.message.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
              >
                <Heart className="h-5 w-5 text-red-500" />
                <span>Add Reaction</span>
              </button>
              
              <button
                onClick={() => handleReply(showContextMenu.message)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
              >
                <Reply className="h-5 w-5 text-blue-500" />
                <span>Reply</span>
              </button>
              
              <button
                onClick={() => handleCopy(showContextMenu.message.content)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
              >
                <Copy className="h-5 w-5 text-gray-500" />
                <span>Copy</span>
              </button>
              
              <button
                onClick={() => setShowContextMenu(null)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left text-red-600"
              >
                <X className="h-5 w-5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reaction Picker */}
      {showReactionPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 m-4 w-80 max-w-full">
            <h3 className="text-lg font-medium mb-4">Choose Reaction</h3>
            <div className="grid grid-cols-6 gap-3 mb-4">
              {['❤️', '👍', '😂', '😮', '😢', '😡'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(showReactionPicker, emoji)}
                  className="text-2xl p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReactionPicker(null)}
              className="w-full p-3 bg-gray-100 rounded-lg text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MobileMessagesPage() {
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
      <MobileMessagesContent />
    </Suspense>
  );
}
