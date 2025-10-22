'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from '@/hooks/useSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EnhancedMessageComponent from '@/components/EnhancedMessageComponent';
import { 
  MessageSquare, Bell, Search, Send, Paperclip, Image as ImageIcon, 
  Smile, MoreVertical, Pin, Archive, VolumeX, Volume2, UserX, 
  UserCheck, Flag, X, Clock, CheckCircle, AlertCircle, Users
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: string;
  status: string;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  recipient: {
    id: string;
    name: string;
    avatar?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  replies?: Message[];
  reactions?: {
    id: string;
    reaction: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }[];
  forwardedFrom?: {
    id: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isBlocked?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function EnhancedMessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState({ used: 0, limit: 30, remaining: 30 });
  const [searchTerm, setSearchTerm] = useState('');
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations and users on component mount
  useEffect(() => {
    if (session?.user?.id) {
      loadConversations();
      loadAvailableUsers();
      loadBlockedUsers();
    }
  }, [session]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users/all');
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const response = await fetch('/api/messages/block');
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blockedUsers?.map((block: any) => block.blocked.id) || []);
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || rateLimitInfo.remaining <= 0) return;

    try {
      const response = await fetch('/api/messages/send-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedConversation,
          content: newMessage.trim(),
          type: 'text',
          attachments
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setAttachments([]);
        setRateLimitInfo(prev => ({
          ...prev,
          used: prev.used + 1,
          remaining: prev.remaining - 1
        }));
        loadConversations(); // Refresh conversations list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleReply = async (messageId: string, content: string) => {
    try {
      const response = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, content })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.reply]);
        loadConversations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    }
  };

  const handleForward = async (messageId: string, recipientIds: string[], additionalMessage?: string) => {
    try {
      const response = await fetch('/api/messages/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, recipientIds, additionalMessage })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadConversations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to forward message');
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Failed to forward message');
    }
  };

  const handleEdit = async (messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? data.updatedMessage : msg
        ));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  };

  const handleDelete = async (messageId: string, type: 'soft' | 'hard') => {
    try {
      const response = await fetch(`/api/messages/${messageId}?type=${type}`, {
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
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const handleBlock = async (userId: string, reason?: string) => {
    try {
      const response = await fetch('/api/messages/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason })
      });

      if (response.ok) {
        setBlockedUsers(prev => [...prev, userId]);
        alert('User blocked successfully');
        loadConversations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    }
  };

  const handleReact = async (messageId: string, reaction: string) => {
    try {
      const response = await fetch('/api/messages/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reaction })
      });

      if (response.ok) {
        const data = await response.json();
        // Update message reactions in state
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const existingReaction = msg.reactions?.find(r => r.user.id === session?.user?.id);
            if (existingReaction) {
              return {
                ...msg,
                reactions: msg.reactions?.map(r => 
                  r.user.id === session?.user?.id ? data.reaction : r
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

  const handleRemoveReaction = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/reactions?messageId=${messageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: msg.reactions?.filter(r => r.user.id !== session?.user?.id)
            };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          newAttachments.push({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: data.url,
            name: file.name
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex h-[600px]">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Messages</h2>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {rateLimitInfo.remaining}/{rateLimitInfo.limit} remaining
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Users className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          {conversation.avatar ? (
                            <img src={conversation.avatar} alt={conversation.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <span className="text-sm font-medium">{conversation.name.charAt(0)}</span>
                          )}
                        </div>
                        {conversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">{conversation.name}</h3>
                          <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                      {conversation.isBlocked && (
                        <UserX className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          {selectedConversationData?.avatar ? (
                            <img src={selectedConversationData.avatar} alt={selectedConversationData.name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <span className="text-sm font-medium">{selectedConversationData?.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{selectedConversationData?.name}</h3>
                          <p className="text-sm text-gray-500">
                            {selectedConversationData?.isOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Bell className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <>
                        {messages.filter(msg => !msg.isDeleted).map((message) => (
                          <div key={message.id} className="group">
                            <EnhancedMessageComponent
                              message={message}
                              onReply={handleReply}
                              onForward={handleForward}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onBlock={handleBlock}
                              onReact={handleReact}
                              onRemoveReaction={handleRemoveReaction}
                              availableUsers={availableUsers}
                            />
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    {attachments.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {attachments.map((attachment, index) => (
                          <div key={index} className="relative">
                            {attachment.type === 'image' ? (
                              <img src={attachment.url} alt={attachment.name} className="w-16 h-16 object-cover rounded" />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs">{attachment.name}</span>
                              </div>
                            )}
                            <button
                              onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        multiple
                        accept="image/*,application/pdf,.doc,.docx"
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={rateLimitInfo.remaining > 0 ? "Type a message..." : "Rate limit reached"}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          disabled={rateLimitInfo.remaining <= 0}
                        />
                      </div>
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || rateLimitInfo.remaining <= 0}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>

                    {rateLimitInfo.remaining <= 5 && (
                      <div className="mt-2 text-sm text-orange-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {rateLimitInfo.remaining === 0 
                          ? "Rate limit reached. Please wait before sending more messages."
                          : `Only ${rateLimitInfo.remaining} messages remaining this hour.`
                        }
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                    <p>Choose a conversation from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-4xl">
            <img src={showImagePreview} alt="Preview" className="max-w-full max-h-full" />
            <button
              onClick={() => setShowImagePreview(null)}
              className="absolute top-4 right-4 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
