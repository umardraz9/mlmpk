import { NextRequest, NextResponse } from 'next/server';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Store active SSE connections (in production, use Redis or similar)
const clients = new Map<string, WritableStreamDefaultWriter>();

// Event types for different notification categories
export enum NotificationEventType {
  MESSAGE_RECEIVED = 'message_received',
  COMMISSION_EARNED = 'commission_earned',
  TASK_COMPLETED = 'task_completed',
  PAYMENT_PROCESSED = 'payment_processed',
  USER_JOINED = 'user_joined',
  SYSTEM_UPDATE = 'system_update'
}

interface NotificationEvent {
  id: string;
  type: NotificationEventType;
  userId: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

// Broadcast notification to specific user
export async function broadcastToUser(userId: string, event: NotificationEvent) {
  const client = clients.get(userId);
  if (client) {
    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      await client.write(new TextEncoder().encode(data));
    } catch (error) {
      console.error('Failed to send notification to user:', userId, error);
      clients.delete(userId);
    }
  }
}

// Broadcast to all connected users (admin announcements)
export async function broadcastToAll(event: Omit<NotificationEvent, 'userId'>) {
  for (const [userId, client] of clients.entries()) {
    try {
      const userEvent = { ...event, userId };
      const data = `data: ${JSON.stringify(userEvent)}\n\n`;
      await client.write(new TextEncoder().encode(data));
    } catch (error) {
      console.error('Failed to send notification to user:', userId, error);
      clients.delete(userId);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // @ts-ignore
    const session = await unstable_getServerSession(request, authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // @ts-ignore
    const userId = session.user.id;

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection confirmation
        const welcomeEvent = {
          id: `connection_${Date.now()}`,
          type: NotificationEventType.SYSTEM_UPDATE,
          userId,
          title: 'Connected',
          message: 'Real-time notifications enabled',
          timestamp: new Date(),
          priority: 'low' as const
        };

        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(welcomeEvent)}\n\n`));

        // Store client connection
        const writer = controller;
        clients.set(userId, {
          write: (chunk) => {
            try {
              controller.enqueue(chunk);
            } catch (error) {
              // Client disconnected
              clients.delete(userId);
            }
          }
        } as any);

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          clients.delete(userId);
        });
      },
      cancel() {
        clients.delete(userId);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('SSE connection error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// POST endpoint to send notifications programmatically
export async function POST(request: NextRequest) {
  try {
    // @ts-ignore
    const session = await unstable_getServerSession(request, authOptions);

    // @ts-ignore
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, type, title, message, data, priority = 'medium' } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    // Create notification event
    const event: NotificationEvent = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as NotificationEventType,
      userId: userId || session.user.id,
      title,
      message,
      data,
      timestamp: new Date(),
      priority
    };

    // Store notification in database
    await prisma.notification.create({
      data: {
        title,
        message,
        type,
        data: data ? JSON.stringify(data) : null,
        recipientId: userId,
        actionUrl: data?.actionUrl,
        actionText: data?.actionText,
        imageUrl: data?.imageUrl,
        priority,
        isActive: true
      }
    });

    // Broadcast to user if they're connected
    if (userId) {
      await broadcastToUser(userId, event);
    } else {
      // Broadcast to all users if no specific user
      await broadcastToAll(event);
    }

    return NextResponse.json({
      success: true,
      eventId: event.id,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Failed to send notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
