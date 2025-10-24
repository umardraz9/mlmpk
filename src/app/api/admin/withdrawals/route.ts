import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

// GET - Get all withdrawal requests
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const dateRange = searchParams.get('dateRange') || '30d'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0)
    }

    const where: any = {
      requestedAt: {
        gte: startDate
      }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod
    }

    const skip = (page - 1) * limit

    // Build Supabase query
    let query = supabase
      .from('withdrawal_requests')
      .select('*, user:users(*)', { count: 'exact' })
      .order('requestedAt', { ascending: false })
      .range(skip, skip + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query = query.eq('paymentMethod', paymentMethod)
    }

    const { data: withdrawalsRaw, count: total, error } = await query

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 })
    }

    const withdrawals = withdrawalsRaw.map(w => ({
      ...w,
      paymentDetails: (() => {
        try {
          return w.paymentDetails ? JSON.parse(w.paymentDetails as unknown as string) : {}
        } catch {
          return {}
        }
      })(),
    }))

    return NextResponse.json({
      withdrawals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create withdrawal request (admin override)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { userId, amount, paymentMethod, paymentDetails } = data

    if (!userId || !amount || !paymentMethod || !paymentDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    // Check user balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Create withdrawal request
    const { data: withdrawal, error: createError } = await supabase
      .from('withdrawal_requests')
      .insert([{
        userId,
        amount,
        paymentMethod,
        paymentDetails: JSON.stringify(paymentDetails),
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        processedBy: session.user.id
      }])
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating withdrawal:', createError)
      return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 })
    }

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: user.balance - amount })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user balance:', updateError)
    }

    return NextResponse.json(withdrawal, { status: 201 })
  } catch (error) {
    console.error('Error creating withdrawal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
