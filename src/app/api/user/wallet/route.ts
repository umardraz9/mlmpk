import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, balance, totalEarnings, availableVoucherPkr, membershipPlan, membershipStatus')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch task completions and compute aggregates
    const { data: completions, error: completionsError } = await supabase
      .from('task_completions')
      .select('reward')
      .eq('userId', session.user.id);

    if (completionsError) {
      console.warn('Wallet API: error loading task_completions, continuing with 0s', completionsError);
    }

    const taskEarningsSum = (completions || []).reduce((sum: number, r: { reward?: number | null }) => sum + (Number(r?.reward) || 0), 0);
    const tasksCompleted = (completions || []).length;
    const referralCommission = Number(user.totalEarnings || 0);
    const totalEarnings = taskEarningsSum + referralCommission;

    // Determine voucher balance
    let voucherBalance = Number(user.availableVoucherPkr || 0);
    if (voucherBalance === 0 && user.membershipPlan && user.membershipStatus === 'ACTIVE') {
      // Try snake_case table first
      let planVoucher = 0;
      const { data: plan1 } = await supabase
        .from('membership_plans')
        .select('voucherAmount')
        .eq('name', user.membershipPlan)
        .single();
      if (plan1?.voucherAmount != null) {
        planVoucher = Number(plan1.voucherAmount) || 0;
      } else {
        const { data: plan2 } = await supabase
          .from('membershipPlans')
          .select('voucherAmount')
          .eq('name', user.membershipPlan)
          .single();
        planVoucher = Number(plan2?.voucherAmount || 0);
      }
      voucherBalance = planVoucher;
    }

    const walletData = {
      balance: Number(user.balance || 0),
      availableVoucherPkr: voucherBalance,
      taskEarnings: taskEarningsSum,
      referralCommission,
      totalEarnings,
      tasksCompleted: tasksCompleted || 0,
    };

    // Add caching headers for performance
    const response = NextResponse.json(walletData);
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;

  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
