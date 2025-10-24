import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

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
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Mock implementation - return empty favorites for now
    // TODO: Implement Supabase favorites storage
    const favorites: any[] = []

    return NextResponse.json({ items: favorites, nextCursor: null })
  } catch (err) {
    console.error('Favorites GET error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/favorites  { type, targetId, action?: 'add' | 'remove' }
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { type, targetId, action } = body as { type?: string; targetId?: string; action?: 'add' | 'remove' }

    if (!type || !targetId) {
      return NextResponse.json({ error: 'type and targetId are required' }, { status: 400 })
    }

    const userId = session.user.id as string

    // Mock implementation - always return success
    // TODO: Implement Supabase favorites storage
    const favorited = action === 'add' || (!action)

    console.log(`User ${userId} ${favorited ? 'favorited' : 'unfavorited'} ${type} ${targetId}`)

    return NextResponse.json({ favorited }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (err: any) {
    console.error('Favorites POST error', {
      message: err?.message,
      code: err?.code,
      stack: err?.stack
    })
    return NextResponse.json({ error: 'Internal Server Error', details: err?.message }, { status: 500 })
  }
}
