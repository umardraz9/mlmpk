'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
// Simple toast implementation
const toast = {
  info: (message: string) => console.log('Info:', message),
  error: (message: string) => console.error('Error:', message),
  success: (message: string) => console.log('Success:', message)
};

// Import skeleton statically (used outside Suspense)
import { MessagesSkeleton } from '@/components/messages/MessagesSkeleton';

// Import components directly for better loading performance
import { MessagesHeader } from '@/components/messages/MessagesHeader';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatHeader } from '@/components/messages/ChatHeader';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { EmptyState } from '@/components/messages/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input as UiInput } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  messageType: 'text' | 'media';
  attachments?: { url: string; name?: string; type?: string }[] | string;
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
  replyTo?: ChatMessage;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
  recipient: {
    id: string;
    name: string;
    image?: string;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatConversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    image?: string;
  };
  lastMessage: ChatMessage | string;
  lastMessageTime?: string;
  unreadCount: number;
  messages: ChatMessage[];
  isPinned?: boolean;
  isArchived?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  type SafeUser = { id?: string; name?: string; image?: string; email?: string };
  const currentUserId = (session?.user as SafeUser | undefined)?.id;
  const currentUser = session?.user as SafeUser | undefined;
  
  // State management
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [typingUsers] = useState<Set<string>>(new Set());
  const [replyTarget, setReplyTarget] = useState<{ id: string; author: string; content: string } | null>(null);
  // User picker (New Message)
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<Array<{ id: string; name: string; image?: string }>>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  // Filtered users for the picker UI
  const visibleUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return userResults;
    return userResults.filter(u => (u.name || '').toLowerCase().includes(q));
  }, [userSearch, userResults]);

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  
  // Refs to prevent infinite loops
  const hasInitializedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowConversationList(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/messages');
    }
  }, [status, router]);

  // Load conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUserId || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const text = await response.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', text);
        throw new Error('Invalid response format');
      }
      
      if (data.success) {
        const conversations = data.conversations || [];
        setConversations(conversations);
      } else {
        throw new Error(data.error || 'Failed to load conversations');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [currentUserId]);

  // React to a message (toggle/replace user's reaction)
  const handleReactMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUserId || !selectedConversation) return;

    const updateLocally = (updater: (m: ChatMessage) => ChatMessage) => {
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? updater(m) : m)
      } : prev);
      setConversations(prev => prev.map(c => c.id === selectedConversation.id ? {
        ...c,
        messages: c.messages.map(m => m.id === messageId ? updater(m) : m)
      } : c));
    };

    const current = selectedConversation.messages.find(m => m.id === messageId);
    const myPrev = current?.reactions?.find(r => r.user.id === currentUserId)?.emoji;

    // Optimistic
    updateLocally((m) => {
      const others = (m.reactions || []).filter(r => r.user.id !== (currentUserId as string));
      if (myPrev === emoji) {
        return { ...m, reactions: others };
      }
      const next = [...others, { id: `tmp-${Date.now()}`, emoji, user: { id: currentUserId as string, name: currentUser?.name || 'You' } }];
      return { ...m, reactions: next };
    });

    try {
      if (myPrev === emoji) {
        await fetch(`/api/messages/reactions?messageId=${encodeURIComponent(messageId)}`, { method: 'DELETE' });
      } else {
        const res = await fetch('/api/messages/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, reaction: emoji })
        });
        const j = await res.json();
        if (!res.ok || !j?.success) throw new Error('Failed');
        // Replace temp with server id if present
        updateLocally((m) => {
          const others = (m.reactions || []).filter(r => r.user.id !== (currentUserId as string));
          const real = { id: j.reaction?.id || `r-${Date.now()}`, emoji, user: { id: currentUserId as string, name: currentUser?.name || 'You' } };
          return { ...m, reactions: [...others, real] };
        });
      }
    } catch (e) {
      // revert by removing/adding back previous state
      updateLocally((m) => {
        const others = (m.reactions || []).filter(r => r.user.id !== (currentUserId as string));
        if (myPrev) {
          return { ...m, reactions: [...others, { id: `revert-${Date.now()}`, emoji: myPrev, user: { id: currentUserId as string, name: currentUser?.name || 'You' } }] };
        }
        return { ...m, reactions: others };
      });
    }
  }, [currentUserId, currentUser?.name, selectedConversation, setSelectedConversation, setConversations]);

  // Edit a message
  const handleEditMessage = useCallback(async (msg: ChatMessage) => {
    try {
      const res = await fetch(`/api/messages/message/${encodeURIComponent(msg.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg.content })
      });
      if (!res.ok) throw new Error('Failed to edit');
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => m.id === msg.id ? { ...m, content: msg.content, isEdited: true, editedAt: new Date().toISOString() } : m)
      } : prev);
      setConversations(prev => prev.map(c => c.id === (selectedConversation?.id || '') ? {
        ...c,
        messages: c.messages.map(m => m.id === msg.id ? { ...m, content: msg.content, isEdited: true, editedAt: new Date().toISOString() } : m)
      } : c));
      toast.success('Message edited');
    } catch (e) {
      toast.error('Failed to edit message');
    }
  }, [selectedConversation?.id]);

  // Delete a message (soft)
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      const now = new Date().toISOString();
      // Optimistic mark deleted
      const markDeleted = (list: ChatMessage[]) => list.map(m => m.id === messageId ? { ...m, isDeleted: true, deletedAt: now } : m);
      setSelectedConversation(prev => prev ? { ...prev, messages: markDeleted(prev.messages) } : prev);
      setConversations(prev => prev.map(c => c.id === (selectedConversation?.id || '') ? { ...c, messages: markDeleted(c.messages) } : c));

      const res = await fetch(`/api/messages/message/${encodeURIComponent(messageId)}?type=soft`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Message deleted');
    } catch (e) {
      toast.error('Failed to delete message');
      // No rollback for simplicity
    }
  }, [selectedConversation?.id]);

  // Load messages for selected conversation
  const fetchMessages = useCallback(async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      setIsLoadingMessages(true);

      const response = await fetch(`/api/messages/${targetUserId}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const text = await response.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('JSON parse error in fetchMessages:', parseError, 'Response text:', text);
        throw new Error('Invalid response format');
      }
      
      if (data.success) {
        setConversations(prev => prev.map(conv => 
          conv.otherUser.id === targetUserId 
            ? { ...conv, messages: data.messages || [] }
            : conv
        ));
        // If this conversation is selected, sync selected state too
        setSelectedConversation(prev => prev && prev.otherUser.id === targetUserId ? { ...prev, messages: data.messages || [] } : prev);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUserId]);

  // Open a direct conversation with a specific userId (even if no prior messages exist)
  const openDirectConversationByUserId = useCallback(async (userId: string) => {
    try {
      // Load existing messages and target user info
      const res = await fetch(`/api/messages/${userId}`, { headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) throw new Error('Failed to load direct messages');
      const data = await res.json();

      const fetchedMessages: ChatMessage[] = (data.messages || []).map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        content: m.content,
        createdAt: typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString(),
        messageType: m.messageType || 'text',
        attachments: m.attachments,
        images: Array.isArray(m.images) ? m.images : [],
        replyToId: m.replyToId,
        isEdited: m.isEdited,
        isDeleted: m.isDeleted,
        editedAt: m.editedAt,
        deletedAt: m.deletedAt,
        reactions: m.reactions,
        replyTo: m.replyTo,
        sender: m.sender,
        recipient: m.recipient,
        status: 'sent'
      }));

      const otherUser = {
        id: data.targetUser.id,
        name: data.targetUser.name || 'User',
        image: data.targetUser.image,
      };

      const last = fetchedMessages[fetchedMessages.length - 1];
      const conv: ChatConversation = {
        id: otherUser.id,
        otherUser,
        lastMessage: last || 'Say hi 👋',
        lastMessageTime: last?.createdAt,
        unreadCount: 0,
        messages: fetchedMessages,
        isOnline: false,
      };

      // Insert or update conversations
      setConversations(prev => {
        const idx = prev.findIndex(c => c.otherUser.id === otherUser.id);
        if (idx === -1) return [conv, ...prev];
        const copy = [...prev];
        copy[idx] = { ...copy[idx], messages: fetchedMessages, lastMessage: conv.lastMessage, lastMessageTime: conv.lastMessageTime };
        return copy;
      });

      // Select it
      setSelectedConversation(conv);
      if (isMobile) setShowConversationList(false);
    } catch (err) {
      console.error('openDirectConversationByUserId error:', err);
    }
  }, [isMobile]);

  // Send message
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!selectedConversation) {
      toast.error('Please select a conversation first');
      return;
    }
    
    if (!currentUserId) {
      toast.error('You must be logged in to send messages');
      return;
    }
    
    if (isSending) {
      toast.info('Please wait, sending previous message...');
      return;
    }

    // Short-circuit: reply flow (text-only for now)
    if (replyTarget && (!attachments || attachments.length === 0)) {
      const tempId = `temp-reply-${Date.now()}`;
      const replied = selectedConversation.messages.find(m => m.id === replyTarget.id);
      const optimisticReply: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        recipientId: selectedConversation.otherUser.id,
        content,
        createdAt: new Date().toISOString(),
        messageType: 'text',
        images: [],
        attachments: [],
        replyTo: replied ? {
          id: replied.id,
          senderId: replied.senderId,
          recipientId: replied.recipientId,
          content: replied.content,
          createdAt: replied.createdAt,
          messageType: replied.messageType,
          images: replied.images,
          attachments: replied.attachments,
          sender: replied.sender,
          recipient: replied.recipient,
          status: replied.status
        } as ChatMessage : undefined,
        sender: { id: currentUserId, name: currentUser?.name || 'You', image: currentUser?.image },
        recipient: selectedConversation.otherUser,
        status: 'sending'
      };

      // optimistic append
      setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, optimisticReply] } : prev);
      setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, messages: [...c.messages, optimisticReply] } : c));

      try {
        const res = await fetch('/api/messages/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: replyTarget.id, content })
        });
        const j = await res.json();
        if (!res.ok || !j?.success) throw new Error('Failed');
        const real = j.message as ChatMessage;
        // replace temp
        setSelectedConversation(prev => prev ? { ...prev, messages: prev.messages.map(m => m.id === tempId ? { ...real, status: 'sent' } : m) } : prev);
        setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, messages: c.messages.map(m => m.id === tempId ? { ...real, status: 'sent' } : m) } : c));
        toast.success('Reply sent');
      } catch (e) {
        // rollback
        setSelectedConversation(prev => prev ? { ...prev, messages: prev.messages.filter(m => m.id !== tempId) } : prev);
        setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, messages: c.messages.filter(m => m.id !== tempId) } : c));
        toast.error('Failed to send reply');
      } finally {
        setReplyTarget(null);
      }
      return;
    }

    // 1) Upload media first to get persistent URLs
    const uploadedImageUrls: string[] = [];
    const uploadedAttachments: Array<{ url: string; name?: string; type?: string }> = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        try {
          const fd = new FormData();
          fd.append('file', file);
          // Correctly map type for upload endpoint
          const uploadType = file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('audio/')
              ? 'audio'
              : 'video';
          fd.append('type', uploadType);
          const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
          const upJson = await upRes.json();
          if (upRes.ok && upJson?.url) {
            if (file.type.startsWith('image/')) {
              uploadedImageUrls.push(upJson.url as string);
            } else {
              uploadedAttachments.push({ url: upJson.url as string, name: file.name, type: file.type || uploadType });
            }
          }
        } catch (e) {
          console.error('Upload failed for file:', file.name, e);
        }
      }
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      recipientId: selectedConversation.otherUser.id,
      content,
      createdAt: new Date().toISOString(),
      messageType: (uploadedImageUrls.length > 0 || uploadedAttachments.length > 0) ? 'media' : 'text',
      images: uploadedImageUrls,
      attachments: uploadedAttachments,
      sender: {
        id: currentUserId,
        name: currentUser?.name || 'You',
        image: currentUser?.image
      },
      recipient: selectedConversation.otherUser,
      status: 'sending'
    };

    // Optimistic update (with real URLs)
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? { 
            ...conv, 
            messages: [...conv.messages, optimisticMessage],
            lastMessage: optimisticMessage,
            lastMessageTime: optimisticMessage.createdAt
          }
        : conv
    ));
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, optimisticMessage],
      lastMessage: optimisticMessage,
      lastMessageTime: optimisticMessage.createdAt
    } : prev);

    try {
      setIsSending(true);

      // 2) Send JSON payload with uploaded URLs so backend stores them
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          recipientId: selectedConversation.otherUser.id,
          images: uploadedImageUrls,
          attachments: uploadedAttachments
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.success && data.message) {
        // Replace temp message with real one
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                messages: conv.messages.map(msg => 
                  msg.id === tempId 
                    ? { ...data.message, status: 'sent' as const }
                    : msg
                )
              }
            : conv
        ));
        
        // Update selectedConversation too
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === tempId 
              ? { ...data.message, status: 'sent' as const }
              : msg
          )
        } : prev);
        
        toast.success('Message sent');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      
      // Remove failed message
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { 
              ...conv, 
              messages: conv.messages.filter(msg => msg.id !== tempId)
            }
          : conv
      ));
      
      // Also remove from selectedConversation
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== tempId)
      } : prev);
    } finally {
      setIsSending(false);
    }
  }, [selectedConversation, currentUserId, currentUser, isSending, replyTarget]);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation: any) => {
    const conv = conversation as ChatConversation;
    setSelectedConversation(conv);
    
    if (isMobile) {
      setShowConversationList(false);
    }
    
    // Load messages if not already loaded
    if (conv.messages.length === 0) {
      fetchMessages(conv.otherUser.id);
    }
    
    // Mark as read
    if (conv.unreadCount > 0) {
      setConversations(prev => prev.map(c => 
        c.id === conv.id 
          ? { ...c, unreadCount: 0 }
          : c
      ));
      // Server-side read receipt (best-effort)
      try {
        fetch('/api/messages/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: conv.otherUser.id })
        }).catch(() => {});
      } catch {}
    }
  }, [isMobile, fetchMessages]);

  // Handle back to conversations (mobile)
  const handleBackToConversations = useCallback(() => {
    setShowConversationList(true);
    setSelectedConversation(null);
  }, []);

  // Load data on mount (only once)
  useEffect(() => {
    if (currentUserId && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchConversations();
    }
  }, [currentUserId, fetchConversations]);

  // Handle URL params for direct conversation
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (!userId) return;
    // Try existing
    if (conversations.length > 0) {
      const conversation = conversations.find(conv => conv.otherUser.id === userId);
      if (conversation) {
        handleSelectConversation(conversation);
        return;
      }
    }
    // Otherwise load and create a direct conversation view
    openDirectConversationByUserId(userId);
  }, [searchParams, conversations, handleSelectConversation, openDirectConversationByUserId]);

  // Poll for new messages in the open conversation (every 5s for better performance)
  useEffect(() => {
    if (!currentUserId || !selectedConversation) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const last = selectedConversation.messages[selectedConversation.messages.length - 1];
        if (!last) return;
        const res = await fetch(`/api/messages/${selectedConversation.otherUser.id}?since=${encodeURIComponent(last.id)}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return;
        const data = await res.json();
        const newMessages: ChatMessage[] = Array.isArray(data.messages) ? data.messages : [];
        if (cancelled || newMessages.length === 0) return;
        // Append new messages
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, ...newMessages]
        } : prev);
        setConversations(prev => prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, messages: [...conv.messages, ...newMessages], lastMessage: newMessages[newMessages.length - 1] || conv.lastMessage, lastMessageTime: (newMessages[newMessages.length - 1]?.createdAt) || conv.lastMessageTime, unreadCount: 0 }
            : conv
        ));
      } catch {
        // Silently handle polling errors
      }
    }, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentUserId, selectedConversation]);

  // Live update via Notifications SSE: refresh chat on incoming message
  useEffect(() => {
    if (!currentUserId) return;
    const es = new EventSource('/api/notifications/stream');
    es.onmessage = async (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'notification') {
          const notif = payload.data;
          if (notif?.type === 'message') {
            // Parse notification.data which may contain senderId
            let dataObj: any = {};
            try { dataObj = typeof notif.data === 'string' ? JSON.parse(notif.data) : (notif.data || {}); } catch {}
            const senderId = dataObj?.senderId || notif?.createdById;
            if (senderId) {
              // If viewing this chat, refresh messages immediately
              if (selectedConversation?.otherUser.id === senderId) {
                fetchMessages(senderId);
              }
              // Always refresh conversations to update last message/unread
              fetchConversations();
            }
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    };
    es.onerror = () => { try { es.close(); } catch {} };
    return () => { try { es.close(); } catch {} };
  }, [currentUserId, selectedConversation?.otherUser.id, fetchMessages, fetchConversations]);

  // Background refresh conversations (every 8s) to update unread counts and latest messages
  useEffect(() => {
    if (!currentUserId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/messages/conversations', { headers: { 'Cache-Control': 'no-cache' } });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.success) return;
        setConversations(prev => {
          const map = new Map(prev.map(c => [c.id, c]));
          const incoming: ChatConversation[] = (data.conversations || []) as ChatConversation[];
          const merged = incoming.map(ic => {
            const ex = map.get(ic.id);
            const base = ex ? { ...ex, ...ic, messages: ex.messages } : { ...ic, messages: ic.messages || [] };
            // If this is the currently open conversation, keep unread at 0 locally
            if (selectedConversation && ic.id === selectedConversation.id) {
              return { ...base, unreadCount: 0 };
            }
            return base;
          });
          return merged;
        });
      } catch {
        // Silently handle refresh errors
      }
    }, 8000);
    return () => { clearInterval(interval); };
  }, [currentUserId]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    return conversations.filter(conv =>
      conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof conv.lastMessage === 'string' 
        ? conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
        : conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [conversations, searchQuery]);

  // Show loading skeleton
  if (status === 'loading' || isLoading) {
    return <MessagesSkeleton />;
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex overflow-hidden">
      {/* New Message: User Picker Modal */}
      <Dialog open={showUserPicker} onOpenChange={setShowUserPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Start a new conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <UiInput
              placeholder="Search users by name..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="h-11"
            />
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 rounded-md border border-gray-100 dark:border-gray-800">
              {isLoadingUsers ? (
                <div className="p-4 text-sm text-gray-500">Loading users...</div>
              ) : (visibleUsers?.length || 0) === 0 ? (
                <div className="p-4 text-sm text-gray-500">No users found</div>
              ) : (
                visibleUsers.map(u => (
                  <button
                    key={u.id}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
                    onClick={() => {
                      setShowUserPicker(false);
                      openDirectConversationByUserId(u.id);
                    }}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.image} alt={u.name} />
                      <AvatarFallback>{u.name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{u.name || 'User'}</div>
                      <div className="text-xs text-gray-500">Tap to open chat</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full h-full">
        {/* Conversations Sidebar */}
        <div className="w-[420px] border-r border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl flex flex-col shadow-xl">
          <MessagesHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewMessage={() => {
              setSelectedConversation(null);
              setShowConversationList(true);
              setShowUserPicker(true);
              setUserSearch('');
            }}
            onShowSettings={() => toast.info('Settings coming soon!')}
            unreadCount={conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
            isLoading={isLoading}
          />

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <EmptyState 
                type={searchQuery ? 'search-empty' : 'no-conversations'}
                searchQuery={searchQuery}
                onStartConversation={() => toast.info('Start conversation feature coming soon!')}
              />
            ) : (
              <ConversationList
                conversations={filteredConversations as any}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                isLoading={isLoading}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl relative">
          {selectedConversation ? (
            <>
              <ChatHeader
                user={selectedConversation.otherUser}
                isOnline={selectedConversation.isOnline}
                lastSeen={selectedConversation.lastSeen}
                isTyping={typingUsers.has(selectedConversation.otherUser.id)}
                onSearch={() => toast.info('Search in chat coming soon!')}
                onShowInfo={() => toast.info('Chat info coming soon!')}
              />

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-950/50 dark:to-gray-900/50">
                {isLoadingMessages ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div className="animate-pulse bg-gray-200 rounded-2xl h-16 w-64"></div>
                      </div>
                    ))}
                  </div>
                ) : selectedConversation.messages.length === 0 ? (
                  <EmptyState type="no-messages" />
                ) : (
                  selectedConversation.messages.map((message, index) => {
                    const prevMessage = selectedConversation.messages[index - 1];
                    const isGrouped = prevMessage && 
                      prevMessage.senderId === message.senderId && 
                      new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 5 * 60 * 1000;

                    return (
                      <MessageBubble
                        key={`${message.id}-${index}`}
                        message={message}
                        isOwn={message.senderId === currentUserId}
                        showAvatar={!isGrouped}
                        isGrouped={isGrouped}
                        currentUserId={currentUserId}
                        onReply={(msg) => setReplyTarget({ id: msg.id, author: msg.sender.name, content: msg.content })}
                        onEdit={(msg) => handleEditMessage(msg as ChatMessage)}
                        onDelete={(id) => handleDeleteMessage(id)}
                        onReact={(id, emoji) => handleReactMessage(id, emoji)}
                      />
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={(isTyping) => {
                  // Handle typing indicator
                }}
                isLoading={isSending}
                disabled={isLoadingMessages}
                replyTarget={replyTarget as any}
                onCancelReply={() => setReplyTarget(null)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-950/50 dark:to-gray-900/50">
              <EmptyState 
                type="select-conversation"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden w-full h-full">
        {showConversationList ? (
          <div className="h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl flex flex-col">
            <MessagesHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNewMessage={() => toast.info('New message feature coming soon!')}
              onShowSettings={() => toast.info('Settings coming soon!')}
              unreadCount={conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
              isLoading={isLoading}
            />

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <EmptyState 
                  type={searchQuery ? 'search-empty' : 'no-conversations'}
                  searchQuery={searchQuery}
                  onStartConversation={() => toast.info('Start conversation feature coming soon!')}
                />
              ) : (
                <ConversationList
                  conversations={filteredConversations as any}
                  selectedConversationId={selectedConversation?.id}
                  onSelectConversation={handleSelectConversation}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          </div>
        ) : selectedConversation ? (
          <div className="h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl flex flex-col relative">
            <ChatHeader
              user={selectedConversation.otherUser}
              isOnline={selectedConversation.isOnline}
              lastSeen={selectedConversation.lastSeen}
              isTyping={typingUsers.has(selectedConversation.otherUser.id)}
              onBack={handleBackToConversations}
              onShowInfo={() => toast.info('Chat info coming soon!')}
              showBackButton={true}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/30 to-white/30 dark:from-gray-950/30 dark:to-gray-900/30">
              {isLoadingMessages ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className="animate-pulse bg-gray-200 rounded-2xl h-16 w-64"></div>
                    </div>
                  ))}
                </div>
              ) : selectedConversation.messages.length === 0 ? (
                <EmptyState type="no-messages" />
              ) : (
                selectedConversation.messages.map((message, index) => {
                  const prevMessage = selectedConversation.messages[index - 1];
                  const isGrouped = prevMessage && 
                    prevMessage.senderId === message.senderId && 
                    new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 5 * 60 * 1000;
                  return (
                    <MessageBubble
                      key={`${message.id}-${index}`}
                      message={message as ChatMessage}
                      isOwn={message.senderId === currentUserId}
                      showAvatar={!isGrouped}
                      isGrouped={isGrouped}
                      currentUserId={currentUserId}
                      onReply={(msg) => setReplyTarget({ id: msg.id, author: msg.sender.name, content: msg.content })}
                      onEdit={(msg) => handleEditMessage(msg as ChatMessage)}
                      onDelete={(id) => handleDeleteMessage(id)}
                      onReact={(id, emoji) => handleReactMessage(id, emoji)}
                    />
                  );
                })
              )}
            </div>
            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={(isTyping) => {
                // Handle typing indicator
              }}
              isLoading={isSending}
              disabled={isLoadingMessages}
              replyTarget={replyTarget as any}
              onCancelReply={() => setReplyTarget(null)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
