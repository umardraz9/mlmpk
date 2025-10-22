import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';

// use shared prisma client from lib/db

// Ensure Node.js runtime for consistent Prisma behavior and SSR globals
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Default plans used when DB has no active plans
function getDefaultPlans() {
  const baseFeatures = [
    'Guaranteed daily task earnings',
    'Referral bonus earnings',
    'Voucher on registration',
    'Upgrade anytime'
  ];

  const plans = [
    {
      id: 'default-basic',
      name: 'BASIC',
      displayName: 'Basic Plan',
      isActive: true,
      price: 1000,
      dailyTaskEarning: 50,
      tasksPerDay: 5,
      maxEarningDays: 30,
      extendedEarningDays: 60,
      minimumWithdrawal: 2000,
      voucherAmount: 500,
      description: 'Start your journey with minimum investment.',
      features: baseFeatures,
      referralCommissions: [
        { level: 1, amount: 200, description: 'Level 1 bonus' },
        { level: 2, amount: 100, description: 'Level 2 bonus' },
        { level: 3, amount: 50, description: 'Level 3 bonus' },
        { level: 4, amount: 25, description: 'Level 4 bonus' },
        { level: 5, amount: 25, description: 'Level 5 bonus' },
      ],
    },
    {
      id: 'default-standard',
      name: 'STANDARD',
      displayName: 'Standard Plan',
      isActive: true,
      price: 3000,
      dailyTaskEarning: 150,
      tasksPerDay: 5,
      maxEarningDays: 30,
      extendedEarningDays: 60,
      minimumWithdrawal: 4000,
      voucherAmount: 500,
      description: 'Best value for growing your earnings.',
      features: baseFeatures,
      referralCommissions: [
        { level: 1, amount: 600, description: 'Level 1 bonus' },
        { level: 2, amount: 300, description: 'Level 2 bonus' },
        { level: 3, amount: 150, description: 'Level 3 bonus' },
        { level: 4, amount: 75, description: 'Level 4 bonus' },
        { level: 5, amount: 75, description: 'Level 5 bonus' },
      ],
    },
    {
      id: 'default-premium',
      name: 'PREMIUM',
      displayName: 'Premium Plan',
      isActive: true,
      price: 8000,
      dailyTaskEarning: 400,
      tasksPerDay: 5,
      maxEarningDays: 30,
      extendedEarningDays: 60,
      minimumWithdrawal: 10000,
      voucherAmount: 500,
      description: 'Highest earnings and best benefits.',
      features: baseFeatures,
      referralCommissions: [
        { level: 1, amount: 1600, description: 'Level 1 bonus' },
        { level: 2, amount: 800, description: 'Level 2 bonus' },
        { level: 3, amount: 400, description: 'Level 3 bonus' },
        { level: 4, amount: 200, description: 'Level 4 bonus' },
        { level: 5, amount: 200, description: 'Level 5 bonus' },
      ],
    },
  ];

  // Compute totalCommission and ensure percentages for default plans
  return plans.map((p) => ({
    ...p,
    referralCommissions: p.referralCommissions.map((c) => ({
      ...c,
      percentage: (c.amount / p.price) * 100,
    })),
    totalCommission: p.referralCommissions.reduce((s, c) => s + c.amount, 0),
  }));
}

// GET /api/membership-plans - Get all membership plans with commission structures
export async function GET(request: NextRequest) {
  try {
    // For now, return default plans since we're using Supabase
    // TODO: Implement Supabase-based plan management later
    const plans = getDefaultPlans();

    return NextResponse.json({
      success: true,
      plans: plans
    });

  } catch (error) {
    console.error('Error fetching membership plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch membership plans' },
      { status: 500 }
    );
  }
}

// POST /api/membership-plans - Create new membership plan (Admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    // TODO: Implement Supabase-based plan creation later
    return NextResponse.json({
      success: false,
      error: 'Plan creation not implemented yet - using default plans'
    }, { status: 501 });

  } catch (error) {
    console.error('Error creating membership plan:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
