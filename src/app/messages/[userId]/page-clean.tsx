'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';

interface Message {
  id: number;
  senderId: string;
  content: string;
  timestamp: string;
}

export default function UserMessagePage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const { userId } = params;
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize with mock data
    setTargetUser({
      id: userId,
      name: 'User ' + userId.slice(-4),
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    });
    setLoading(false);
  }, [userId]);

  const sendMessage = async () => {
    if (newMessage.trim() && targetUser) {
      const message: Message = {
        id: messages.length + 1,
        senderId: 'current-user',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages([...messages, message]);
      const messageContent = newMessage;
      setNewMessage('');

      try {
        // Send real notification to the recipient
        const response = await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'New Message',
            message: `You have a new message: "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"`,
            type: 'message',
            category: 'social',
            recipientId: userId,
            data: {
              messageContent: messageContent,
              senderId: 'current-user',
              conversationId: userId
            }
          })
        });

        if (response.ok) {
          console.log('✅ Message notification sent successfully');
          alert('Message sent! Notification created for recipient.');
        } else {
          console.error('❌ Failed to send message notification');
          alert('Failed to send notification');
        }
      } catch (error) {
        console.error('Error sending message notification:', error);
        alert('Error sending notification');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img
            src={targetUser?.avatar}
            alt={targetUser?.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h1 className="font-semibold">{targetUser?.name}</h1>
            <p className="text-sm text-gray-500">Testing notifications</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">🧪 Testing Notification System</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Send a message below to test real notifications between users!
          </p>
        </div>

        {messages.map((message) => (
          <div key={message.id} className="flex justify-end">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
              <p>{message.content}</p>
              <p className="text-xs opacity-75 mt-1">{message.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message to test notifications..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
