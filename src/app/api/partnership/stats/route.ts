import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('referralCode, totalEarnings, pendingCommission')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get referral counts by level
    const { data: level1Referrals } = await supabase
      .from('users')
      .select('id')
      .eq('sponsorId', session.user.id)

    const level1Ids = (level1Referrals || []).map(u => u.id)
    const { data: level2Referrals } = level1Ids.length > 0
      ? await supabase.from('users').select('id').in('sponsorId', level1Ids)
      : { data: [] }

    const level2Ids = (level2Referrals || []).map(u => u.id)
    const { data: level3Referrals } = level2Ids.length > 0
      ? await supabase.from('users').select('id').in('sponsorId', level2Ids)
      : { data: [] }

    const level3Ids = (level3Referrals || []).map(u => u.id)
    const { data: level4Referrals } = level3Ids.length > 0
      ? await supabase.from('users').select('id').in('sponsorId', level3Ids)
      : { data: [] }

    const level4Ids = (level4Referrals || []).map(u => u.id)
    const { data: level5Referrals } = level4Ids.length > 0
      ? await supabase.from('users').select('id').in('sponsorId', level4Ids)
      : { data: [] }

    // Calculate monthly earnings (current month)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const { data: monthlyTransactions } = await supabase
      .from('transactions')
      .select('amount')
      .eq('userId', session.user.id)
      .eq('type', 'COMMISSION')
      .gte('createdAt', currentMonth.toISOString())

    const monthlyEarnings = (monthlyTransactions || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

    const stats = {
      referralCode: user.referralCode,
      totalReferrals: (level1Referrals?.length || 0) + (level2Referrals?.length || 0) + (level3Referrals?.length || 0) + (level4Referrals?.length || 0) + (level5Referrals?.length || 0),
      totalCommissions: user.totalEarnings,
      level1Count: level1Referrals?.length || 0,
      level2Count: level2Referrals?.length || 0,
      level3Count: level3Referrals?.length || 0,
      level4Count: level4Referrals?.length || 0,
      level5Count: level5Referrals?.length || 0,
      monthlyEarnings
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Partnership stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
