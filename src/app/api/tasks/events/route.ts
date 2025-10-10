import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'

// Store active connections
const connections = new Set<ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    console.log('📡 New SSE connection from user:', session.user.email)

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Add this connection to our set
        connections.add(controller)
        console.log('📊 Active SSE connections:', connections.size)

        // Send initial connection message
        const data = JSON.stringify({
          type: 'connected',
          message: 'Real-time task updates connected',
          timestamp: new Date().toISOString()
        })
        
        controller.enqueue(`data: ${data}\n\n`)

        // Keep connection alive with periodic heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`)
          } catch (error) {
            console.log('💔 Heartbeat failed, connection closed')
            clearInterval(heartbeat)
            connections.delete(controller)
          }
        }, 30000) // 30 seconds

        // Clean up when connection closes
        request.signal.addEventListener('abort', () => {
          console.log('🔌 SSE connection closed for user:', session.user.email)
          clearInterval(heartbeat)
          connections.delete(controller)
          console.log('📊 Remaining SSE connections:', connections.size)
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })
  } catch (error) {
    console.error('❌ Error setting up SSE:', error)
    if ((error as any)?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized: Please sign in to use real-time updates' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Function to broadcast updates to all connected clients
export function broadcastTaskUpdate(type: string, data: any) {
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  })

  console.log(`📡 Broadcasting ${type} to ${connections.size} connections`)

  // Send to all active connections
  connections.forEach((controller) => {
    try {
      controller.enqueue(`data: ${message}\n\n`)
    } catch (error) {
      console.log('💔 Failed to send to connection, removing it')
      connections.delete(controller)
    }
  })
}
