import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Server-Sent Events stream for real-time notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set up Server-Sent Events headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    // Create a readable stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection confirmation
        controller.enqueue(`data: ${JSON.stringify({
          type: 'connected',
          message: 'Notification stream connected',
          timestamp: new Date().toISOString()
        })}\n\n`)

        // Set up periodic polling for new notifications
        const pollInterval = setInterval(async () => {
          try {
            // Get unread notifications for the user
            const notifications = await prisma.notification.findMany({
              where: {
                isActive: true,
                AND: [
                  {
                    OR: [
                      {
                        recipientId: session.user.id,
                        isRead: false,
                        isDelivered: false
                      },
                      {
                        isGlobal: true,
                        isDelivered: false,
                        OR: [
                          { role: null },
                          { role: session.user.role }
                        ]
                      }
                    ]
                  },
                  {
                    OR: [
                      { scheduledFor: null },
                      { scheduledFor: { lte: new Date() } }
                    ]
                  },
                  {
                    OR: [
                      { expiresAt: null },
                      { expiresAt: { gt: new Date() } }
                    ]
                  }
                ]
              },
              orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
              ],
              take: 10,
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            })

            // Send new notifications
            for (const notification of notifications) {
              controller.enqueue(`data: ${JSON.stringify({
                type: 'notification',
                data: notification,
                timestamp: new Date().toISOString()
              })}\n\n`)

              // Mark as delivered
              await prisma.notification.update({
                where: { id: notification.id },
                data: { 
                  isDelivered: true,
                  deliveredAt: new Date()
                }
              })
            }

            // Send heartbeat to keep connection alive
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`)

          } catch (error) {
            console.error('Error in notification stream:', error)
            controller.enqueue(`data: ${JSON.stringify({
              type: 'error',
              message: 'Stream error occurred',
              timestamp: new Date().toISOString()
            })}\n\n`)
          }
        }, 5000) // Poll every 5 seconds

        // Clean up when connection closes
        const cleanup = () => {
          clearInterval(pollInterval)
          try {
            controller.close()
          } catch (error) {
            // Connection already closed
          }
        }

        // Handle connection close
        request.signal.addEventListener('abort', cleanup)
        
        // Set timeout to prevent indefinite connections
        setTimeout(cleanup, 30 * 60 * 1000) // 30 minutes max
      }
    })

    return new NextResponse(stream, { headers })
  } catch (error) {
    console.error('Error setting up notification stream:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 