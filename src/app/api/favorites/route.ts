import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Session } from 'next-auth'

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET /api/favorites?type=PRODUCT|ARTICLE|PERSON|TASK|POST&cursor=...&limit=...
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || undefined
    const cursor = searchParams.get('cursor') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

    const where = {
      userId: session.user.id as string,
      ...(type ? { type } : {}),
    }

    const items = await prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = items.length > limit
    const data = hasMore ? items.slice(0, -1) : items
    const nextCursor = hasMore ? data[data.length - 1]?.id : null

    return NextResponse.json({ items: data, nextCursor })
  } catch (err) {
    console.error('Favorites GET error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/favorites  { type, targetId, action?: 'add' | 'remove' }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { type, targetId, action } = body as { type?: string; targetId?: string; action?: 'add' | 'remove' }

    if (!type || !targetId) {
      return NextResponse.json({ error: 'type and targetId are required' }, { status: 400 })
    }

    const userId = session.user.id as string

    // Determine toggle behavior
    const existing = await prisma.favorite.findUnique({
      where: { userId_type_targetId: { userId, type, targetId } },
    }).catch(() => null)

    let favorited = false

    if (action === 'add' || (!action && !existing)) {
      await prisma.favorite.upsert({
        where: { userId_type_targetId: { userId, type, targetId } },
        update: {},
        create: { userId, type, targetId },
      })
      favorited = true
      // Skip notifications for now - can be added later
      console.log(`User ${userId} favorited ${type} ${targetId}`)
    } else if (action === 'remove' || (!action && existing)) {
      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } })
      }
      favorited = false
    }

    return NextResponse.json({ favorited }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (err) {
    console.error('Favorites POST error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
