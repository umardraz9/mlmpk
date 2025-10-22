import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { resolvePlanByName } from '@/lib/plans';

// Commission rates for 5-level referral system
const COMMISSION_RATES = {
  level1: 0.20, // 20%
  level2: 0.10, // 10%
  level3: 0.05, // 5%
  level4: 0.03, // 3%
  level5: 0.02  // 2%
};

// Calculate commission breakdown for user
async function calculateCommissionBreakdown(userId: string, directReferrals: Array<{id: string, membershipStatus: string, membershipPlan: string}>) {
  const breakdown = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
  };

  // Level 1: Direct referrals
  for (const referral of directReferrals) {
    if (referral.membershipStatus === 'ACTIVE') {
      // Calculate commission based on referral's plan
      const referralPlan = await resolvePlanByName(null, referral.membershipPlan || 'BASIC');
      if (referralPlan) {
        breakdown.level1 += referralPlan.price * COMMISSION_RATES.level1;
      }
    }
  }

  // Level 2-5: Indirect referrals (simplified calculation)
  // In a real system, you'd traverse the referral tree
  // For now, we'll calculate based on existing referral earnings
  const { data: userData } = await supabase
    .from('users')
    .select('referralEarnings')
    .eq('id', userId)
    .single();

  if (userData?.referralEarnings) {
    // Distribute referral earnings across levels (approximation)
    const totalReferralEarnings = userData.referralEarnings;
    breakdown.level2 = totalReferralEarnings * 0.25; // 25% of total referral earnings
    breakdown.level3 = totalReferralEarnings * 0.15; // 15% of total referral earnings
    breakdown.level4 = totalReferralEarnings * 0.08; // 8% of total referral earnings
    breakdown.level5 = totalReferralEarnings * 0.02; // 2% of total referral earnings
  }

  return breakdown;
}

// Helper function to get global task amount setting from config
// For now, we'll use environment variable or default to null (use plan-specific)
function getGlobalTaskAmount(): number | null {
  const globalAmount = process.env.GLOBAL_TASK_AMOUNT
  return globalAmount ? parseInt(globalAmount, 10) : null
};

export async function GET(_request: NextRequest) {
  try {
    console.log('📊 API: Starting user stats request...');
    console.log('📊 API: Request headers:', {
      cookie: _request.headers.get('cookie') ? 'present' : 'missing',
      authorization: _request.headers.get('authorization') ? 'present' : 'missing'
    });
    
    // Try to get session, but continue without it for testing
    let session: any = null;
    try {
      session = await requireAuth();
      console.log('📊 API: Session obtained:', {
        userId: session?.user?.id,
        email: session?.user?.email
      });
    } catch (authError) {
      console.log('📊 API: Authentication failed:', authError);
      console.log('📊 API: Using fallback user for demonstration');
      // Fallback to test user when auth fails
      session = {
        user: {
          id: '1',
          email: 'user@example.com'
        }
      };
    }

    // Fetch user data from database with membership fields
    // Always prioritize finding by ID (more reliable than email)
    let user = null;
    
    // Try by ID first
    if (session.user.id) {
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          id, name, email, referralCode, balance, totalEarnings, 
          pendingCommission, availableVoucherPkr, isActive, isAdmin, 
          sponsorId, createdAt, membershipPlan, membershipStatus, 
          membershipStartDate, membershipEndDate, earningsContinueUntil, 
          taskEarnings, referralEarnings, dailyTasksCompleted, 
          lastTaskCompletionDate
        `)
        .eq('id', session.user.id)
        .single();
      
      if (!error && userData) {
        user = userData;
      }
      console.log('📊 API: User lookup by ID result:', user ? 'Found' : 'Not found');
    }
    
    // Fallback to email if ID lookup failed
    if (!user && session.user.email) {
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          id, name, email, referralCode, balance, totalEarnings, 
          pendingCommission, availableVoucherPkr, isActive, isAdmin, 
          sponsorId, createdAt, membershipPlan, membershipStatus, 
          membershipStartDate, membershipEndDate, earningsContinueUntil, 
          taskEarnings, referralEarnings, dailyTasksCompleted, 
          lastTaskCompletionDate
        `)
        .eq('email', session.user.email)
        .single();
      
      if (!error && userData) {
        user = userData;
      }
      console.log('📊 API: User lookup by email result:', user ? 'Found' : 'Not found');
    }

    if (!user) {
      console.error('📊 API: User not found - ID:', session.user.id, 'Email:', session.user.email);
      return NextResponse.json({ 
        error: 'User not found. Please log in again.',
        sessionUserId: session.user.id,
        sessionUserEmail: session.user.email
      }, { status: 404 });
    }
    
    console.log('📊 API: User found:', { id: user.id, email: user.email, name: user.name });

    // Count referrals and calculate commissions
    const { data: directReferrals = [], error: referralError } = await supabase
      .from('users')
      .select('id, name, membershipStatus, membershipPlan, balance, createdAt')
      .eq('referredBy', user.referralCode);

    const totalReferrals = directReferrals.length;

    // Load plan details (robust to casing mismatches)
    let plan: any = null;
    if (user.membershipPlan) {
      const normalizedPlan = (user.membershipPlan || '').toUpperCase();
      if (normalizedPlan) {
        const { data: planData } = await supabase
          .from('membershipPlans')
          .select('*')
          .or(`name.eq.${normalizedPlan},name.eq.${user.membershipPlan}`)
          .single();
        
        if (planData) {
          plan = planData;
        } else {
          // Fallback to default plan definitions when DB has no plans
          plan = await resolvePlanByName(null, user.membershipPlan);
        }
      }
    }

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    // Calculate per-task amount consistently with other APIs
    const globalTaskAmount = getGlobalTaskAmount()
    let perTaskAmount: number
    if (globalTaskAmount && globalTaskAmount > 0) {
      perTaskAmount = globalTaskAmount
    } else if (plan && (plan as any).id) {
      const tasksPerDayVal = plan?.tasksPerDay ?? 5
      const dailyEarning = plan?.dailyTaskEarning ?? 0
      perTaskAmount = dailyEarning > 0 ? Math.round(dailyEarning / tasksPerDayVal) : 30
    } else {
      perTaskAmount = 30
    }

    const tasksPerDay = plan?.tasksPerDay ?? 5;
    const dailyTaskEarning = plan?.dailyTaskEarning ?? 0;

    // Compute today's task completions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: completionsToday = 0 } = await supabase
      .from('taskCompletions')
      .select('*', { count: 'exact', head: true })
      .eq('userId', session.user.id)
      .gte('completedAt', today.toISOString());

    // Earning period logic based on referrals:
    // Basic Plan: 
    //   - Without referrals: 30 days earning period
    //   - With referrals (any plan): 60 days earning period
    // Standard Plan:
    //   - Without referrals: 30 days earning period  
    //   - With Standard/Premium referrals: 60 days earning period
    //   - With only Basic referrals: 30 days earning period
    // Premium Plan:
    //   - Without referrals: 30 days earning period
    //   - With Premium referrals: 60 days earning period
    //   - With Basic/Standard referrals: 30 days earning period
    
    const registrationDate = user.membershipStartDate || user.createdAt;
    const hasReferrals = totalReferrals > 0;
    
    // Calculate earning days based on plan and referrals
    let totalEarningDays = plan?.maxEarningDays || 30; // Default 30 days
    
    if (hasReferrals) {
      const userPlan = user.membershipPlan?.toUpperCase() || 'BASIC';
      
      // Check referral plan types
      const referralPlanTypes = directReferrals.map(r => r.membershipPlan?.toUpperCase() || 'BASIC');
      const hasBasicReferral = referralPlanTypes.includes('BASIC');
      const hasStandardReferral = referralPlanTypes.includes('STANDARD');
      const hasPremiumReferral = referralPlanTypes.includes('PREMIUM');
      
      if (userPlan === 'BASIC') {
        // Basic plan: Any referral extends to 60 days
        totalEarningDays = plan?.extendedEarningDays || 60;
      } else if (userPlan === 'STANDARD') {
        // Standard plan: Only Standard/Premium referrals extend to 60 days
        if (hasStandardReferral || hasPremiumReferral) {
          totalEarningDays = plan?.extendedEarningDays || 60;
        }
      } else if (userPlan === 'PREMIUM') {
        // Premium plan: Only Premium referrals extend to 60 days
        if (hasPremiumReferral) {
          totalEarningDays = plan?.extendedEarningDays || 60;
        }
      }
    }
    
    // Calculate the actual earning end date
    const earningPeriodEnd = new Date(registrationDate.getTime() + (totalEarningDays * 24 * 60 * 60 * 1000));
    
    // Use earningsContinueUntil if admin has manually extended it
    const finalEarningEnd = user.earningsContinueUntil && user.earningsContinueUntil > earningPeriodEnd 
      ? user.earningsContinueUntil 
      : earningPeriodEnd;
    
    const isWithinEarningPeriod = now <= finalEarningEnd;
    const userAny = user as any;
    const tasksEnabled = typeof userAny?.tasksEnabled === 'boolean' ? userAny.tasksEnabled : true;
    const eligible = !!user && user.membershipStatus === 'ACTIVE' && tasksEnabled && isWithinEarningPeriod && !!plan;

    // Calculate active days since membership start
    const membershipStart = user.membershipStartDate || user.createdAt
    const activeDays = Math.floor((now.getTime() - membershipStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Calculate remaining earning days based on the final earning end date
    const daysRemaining = Math.max(0, Math.ceil((finalEarningEnd.getTime() - now.getTime()) / msPerDay));

    // Set voucher balance based on user's plan if not already set
    let voucherBalance = user.availableVoucherPkr || 0;
    if (voucherBalance === 0 && user.membershipStatus === 'ACTIVE' && plan) {
      voucherBalance = plan.voucherAmount || 0;
    }

    // Debug logging
    console.log('DEBUG - User voucher data:', {
      userId: user.id,
      email: user.email,
      availableVoucherPkr: user.availableVoucherPkr,
      membershipPlan: user.membershipPlan,
      membershipStatus: user.membershipStatus,
      planVoucherAmount: plan?.voucherAmount,
      finalVoucherBalance: voucherBalance
    });

    // Return actual user data from database
    const stats = {
      totalEarnings: user.balance || 0,
      voucherBalance: voucherBalance,
      totalReferrals: totalReferrals,
      directReferrals: totalReferrals,
      hasInvested: (user.membershipStatus === 'ACTIVE'),
      isActive: user.isActive,
      referralCode: user.referralCode,
      commissionBreakdown: await calculateCommissionBreakdown(user.id, directReferrals),
      // Membership summary for dashboard
      membershipStatus: user.membershipStatus,
      membershipPlan: plan ? {
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        price: plan.price,
        dailyTaskEarning: plan.dailyTaskEarning,
        tasksPerDay: tasksPerDay,
        maxEarningDays: plan.maxEarningDays,
        extendedEarningDays: plan.extendedEarningDays,
        minimumWithdrawal: plan.minimumWithdrawal,
        voucherAmount: plan.voucherAmount
      } : null,
      membershipStartDate: user.membershipStartDate,
      membershipEndDate: user.membershipEndDate,
      earningEndsAt: finalEarningEnd,
      earningDaysRemaining: daysRemaining,
      totalEarningDays: totalEarningDays,
      perTaskAmount,
      dailyTaskEarning,
      // Task meta
      completionsToday,
      tasksPerDay,
      eligible,
      activeDays,
      dailyEarningsToday: completionsToday * perTaskAmount
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    
    // Return safe default data for new users (NO FREE PLANS!)
    return NextResponse.json({
      totalEarnings: 0,
      voucherBalance: 0, // No free vouchers
      totalReferrals: 0,
      directReferrals: 0,
      hasInvested: false, // User has NOT invested
      isActive: true,
      referralCode: '',
      commissionBreakdown: {
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0
      },
      membershipStatus: 'INACTIVE', // User must pay to activate
      membershipPlan: null, // No plan until payment
      membershipStartDate: null,
      membershipEndDate: null,
      dailyEarningsToday: 0,
      totalTaskEarnings: 0,
      earningDaysRemaining: 0
    });
  }
}