'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

export default function MobileMessagesPage() {
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
  const [currentView, setCurrentView] = useState<'chats' | 'conversation'>('chats');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on component mount
  useEffect(() => {
    if (session?.user?.id) {
      loadConversations();
      loadAllUsers();
    }
  }, [session]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Find conversation data
        const convData = conversations.find(c => c.id === conversationId);
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
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* WhatsApp-style Mobile Interface */}
      
      {/* Chats List View */}
      {currentView === 'chats' && (
        <div className="h-full flex flex-col bg-white">
          {/* Header */}
          <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-medium">WhatsApp</h1>
            <div className="flex items-center gap-4">
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
                className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No chats yet</p>
                <p className="text-sm text-center px-8">Tap the message icon to start a new conversation</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleConversationSelect(conv.id)}
                  className="flex items-center p-4 border-b border-gray-100 active:bg-gray-50 transition-colors"
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
                      <h3 className="font-medium text-gray-900 truncate">{conv.name}</h3>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''}
                        </span>
                        {conv.unreadCount > 0 && (
                          <div className="bg-green-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate flex-1">
                        {typeof conv.lastMessage === 'string' ? conv.lastMessage : 'Tap to start messaging'}
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
            className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white active:bg-green-700 transition-colors"
          >
            <MessageSquarePlus className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Conversation View */}
      {currentView === 'conversation' && selectedConversationData && (
        <div className="h-full flex flex-col bg-white">
          {/* Chat Header */}
          <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
            <button onClick={handleBackToChats} className="p-1">
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
              <h2 className="font-medium truncate">{selectedConversationData.name}</h2>
              <p className="text-xs text-green-100">online</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Video className="h-5 w-5" />
              <Phone className="h-5 w-5" />
              <MoreVertical className="h-5 w-5" />
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 bg-opacity-50" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}>
            <div className="p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                </div>
              ) : (
                messages.filter(msg => !msg.isDeleted).map((message) => {
                  const isCurrentUser = message.senderId === session.user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] px-3 py-2 rounded-lg ${
                        isCurrentUser 
                          ? 'bg-green-500 text-white rounded-br-sm' 
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                      }`}>
                        {message.content && (
                          <p className="text-sm leading-relaxed">{message.content}</p>
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
                                  className="max-w-full h-auto rounded-lg cursor-pointer"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
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
            <div className="px-4 py-2 bg-gray-100 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Replying to: {replyingTo.content.substring(0, 30)}...
                </span>
              </div>
              <button onClick={() => setReplyingTo(null)}>
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview.length > 0 && (
            <div className="px-4 py-2 bg-gray-100 border-t">
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
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 bg-white border-t flex items-end gap-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="p-2 text-gray-500 active:bg-gray-100 rounded-full">
                <Paperclip className="h-5 w-5" />
              </label>
              
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-500 active:bg-gray-100 rounded-full"
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
                          className="text-lg p-1 hover:bg-gray-100 rounded transition-colors"
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
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                disabled={sending}
              />
              
              <button
                onClick={sendMessage}
                disabled={(!newMessage.trim() && selectedImages.length === 0) || sending}
                className="p-2 bg-green-600 text-white rounded-full disabled:bg-gray-300 active:bg-green-700 transition-colors"
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
          <div className="bg-white rounded-lg w-full max-w-md max-h-96">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Chat</h3>
              <button onClick={() => setShowNewChat(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    handleConversationSelect(user.id);
                    setShowNewChat(false);
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
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
    </div>
  );
}
