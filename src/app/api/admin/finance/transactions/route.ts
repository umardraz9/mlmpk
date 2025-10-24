import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

// GET /api/admin/finance/transactions
// Query params: type, status, search, limit, offset
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = Number(searchParams.get('limit') || 100)
    const offset = Number(searchParams.get('offset') || 0)

    // Build Supabase query
    let query = supabase
      .from('transactions')
      .select('*, user:users(id, name, email)', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && type !== 'all') {
      query = query.eq('type', type.toUpperCase())
    }

    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase())
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const mapped = (transactions || []).map(t => ({
      id: t.id,
      type: (t.type || '').toLowerCase(),
      amount: t.amount,
      status: (t.status || '').toLowerCase(),
      userId: t.userId,
      user: { name: t.user?.name ?? null, email: t.user?.email ?? '' },
      description: t.description ?? '',
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))

    return NextResponse.json({ transactions: mapped })
  } catch (error) {
    console.error('Finance transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
