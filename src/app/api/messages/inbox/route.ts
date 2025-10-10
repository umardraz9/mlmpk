import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { db as prisma } from '@/lib/db'

// GET /api/messages/inbox?limit=5 - Fetch recent direct messages for current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '5', 10)))

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        content: true,
        status: true,
        createdAt: true,
        senderId: true,
        recipientId: true,
        sender: {
          select: { id: true, name: true, avatar: true }
        },
        recipient: {
          select: { id: true, name: true, avatar: true }
        }
      }
    })

    const formatted = messages.map(m => ({
      id: m.id,
      content: m.content,
      status: m.status,
      createdAt: m.createdAt,
      sender: m.sender,
      recipient: m.recipient,
      senderId: m.senderId,
      recipientId: m.recipientId,
      unread: m.recipientId === session.user.id && m.status !== 'read'
    }))

    return NextResponse.json({ success: true, messages: formatted })
  } catch (error) {
    console.error('Error fetching inbox messages:', error)
    if ((error as any)?.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
