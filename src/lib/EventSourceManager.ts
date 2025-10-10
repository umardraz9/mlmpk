/**
 * Singleton EventSource Manager for Social Page
 * Prevents multiple SSE connections and manages subscriptions efficiently
 */

type EventCallback = (data: any) => void;

interface Subscription {
  id: string;
  callback: EventCallback;
}

class EventSourceManager {
  private static instance: EventSourceManager;
  private eventSource: EventSource | null = null;
  private subscriptions: Map<string, Subscription[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): EventSourceManager {
    if (!EventSourceManager.instance) {
      EventSourceManager.instance = new EventSourceManager();
    }
    return EventSourceManager.instance;
  }

  public connect(url: string = '/api/notifications/stream'): void {
    if (this.eventSource?.readyState === EventSource.OPEN || this.isConnecting) {
      return; // Already connected or connecting
    }

    this.isConnecting = true;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('✅ EventSource connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.notifySubscribers(payload);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = () => {
        console.error('EventSource error');
        this.isConnecting = false;
        this.handleReconnect();
      };
    } catch (error) {
      console.error('Error creating EventSource:', error);
      this.isConnecting = false;
    }
  }

  public subscribe(eventType: string, callback: EventCallback): string {
    const subscriptionId = `${eventType}-${Date.now()}-${Math.random()}`;
    const subscription: Subscription = { id: subscriptionId, callback };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    this.subscriptions.get(eventType)!.push(subscription);

    // Auto-connect if not connected
    if (!this.eventSource || this.eventSource.readyState !== EventSource.OPEN) {
      this.connect();
    }

    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): void {
    for (const [eventType, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((sub) => sub.id !== subscriptionId);
      if (filtered.length === 0) {
        this.subscriptions.delete(eventType);
      } else {
        this.subscriptions.set(eventType, filtered);
      }
    }

    // Disconnect if no subscribers
    if (this.subscriptions.size === 0) {
      this.disconnect();
    }
  }

  private notifySubscribers(payload: any): void {
    const eventType = payload?.type || 'unknown';
    const subscribers = this.subscriptions.get(eventType) || [];

    subscribers.forEach((sub) => {
      try {
        sub.callback(payload);
      } catch (error) {
        console.error(`Error in subscriber callback for ${eventType}:`, error);
      }
    });

    // Also notify wildcard subscribers
    const wildcardSubs = this.subscriptions.get('*') || [];
    wildcardSubs.forEach((sub) => {
      try {
        sub.callback(payload);
      } catch (error) {
        console.error('Error in wildcard subscriber callback:', error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.disconnect();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.disconnect();
      this.connect();
    }, delay);
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }

  public getConnectionState(): number | null {
    return this.eventSource?.readyState ?? null;
  }

  public getSubscriberCount(): number {
    let count = 0;
    this.subscriptions.forEach((subs) => {
      count += subs.length;
    });
    return count;
  }
}

export default EventSourceManager;

/**
 * React Hook for using EventSource
 */
export function useEventSource<T = any>(
  eventType: string,
  callback: (data: T) => void,
  dependencies: any[] = []
): void {
  if (typeof window === 'undefined') return;

  const manager = EventSourceManager.getInstance();

  React.useEffect(() => {
    const subscriptionId = manager.subscribe(eventType, callback);

    return () => {
      manager.unsubscribe(subscriptionId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...dependencies]);
}

import React from 'react';
