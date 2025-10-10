import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
    const { searchParams } = new URL(request.url);
    let includeAll = searchParams.get('includeAll') === '1' || searchParams.get('includeAll') === 'true';
    const includeInactivePublic = searchParams.get('includeInactive') === '1' || searchParams.get('includeInactive') === 'true';
    const includeDefaults = searchParams.get('includeDefaults') === '1' || searchParams.get('includeDefaults') === 'true';
    if (includeAll) {
      // Only admins can request all plans (including inactive)
      try {
        await requireAdmin();
      } catch {
        includeAll = false;
      }
    }

    const plans = await prisma.membershipPlan.findMany({
      where: (includeAll || includeInactivePublic) ? {} : { isActive: true },
      include: {
        referralCommissions: {
          orderBy: { level: 'asc' }
        }
      },
      orderBy: { price: 'asc' }
    });

    // Parse features JSON for each plan and ensure commission percentages (robust parsing)
    let plansWithFeatures: any[] = plans.map(plan => {
      let featuresArr: any[] = [];
      if (plan.features) {
        try {
          const parsed = JSON.parse(plan.features);
          featuresArr = Array.isArray(parsed) ? parsed : [];
        } catch {
          featuresArr = [];
        }
      }
      return {
        ...plan,
        features: featuresArr,
        referralCommissions: plan.referralCommissions.map((comm) => ({
          ...comm,
          percentage: typeof comm.percentage === 'number' && !Number.isNaN(comm.percentage)
            ? comm.percentage
            : (comm.amount / (plan.price || 1)) * 100
        })),
        totalCommission: plan.referralCommissions.reduce((sum, comm) => sum + comm.amount, 0)
      }
    });

    // Correct PREMIUM price if it was set incorrectly in DB
    plansWithFeatures = plansWithFeatures.map(p =>
      p.name === 'PREMIUM' && p.price !== 8000 ? { ...p, price: 8000 } : p
    );

    // Merge defaults conditionally
    // IMPORTANT: Only include default plans when the database has ZERO plans.
    // This ensures that if an admin deletes a plan, it does not reappear from defaults.
    if (plansWithFeatures.length === 0) {
      plansWithFeatures = getDefaultPlans();
    }

    // Sort by price ascending for consistent UI
    plansWithFeatures.sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));

    return NextResponse.json({
      success: true,
      plans: plansWithFeatures
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
    try {
      await requireAdmin();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const {
      name,
      displayName,
      price,
      dailyTaskEarning,
      tasksPerDay,
      maxEarningDays,
      extendedEarningDays,
      minimumWithdrawal,
      voucherAmount,
      description,
      features,
      commissions
    } = body;

    // Validate required fields
    if (!name || !displayName || price === undefined || dailyTaskEarning === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Return existing plan if already present (idempotent by plan name)
    const existing = await prisma.membershipPlan.findFirst({
      where: { name: String(name).toUpperCase() }
    });
    if (existing) {
      return NextResponse.json({
        success: true,
        plan: existing,
        message: 'Membership plan already exists'
      });
    }

    // Create membership plan
    const plan = await prisma.membershipPlan.create({
      data: {
        name: String(name).toUpperCase(),
        displayName: String(displayName),
        price: Number(price),
        dailyTaskEarning: Number(dailyTaskEarning),
        tasksPerDay: tasksPerDay ? Number(tasksPerDay) : 5,
        maxEarningDays: maxEarningDays ? Number(maxEarningDays) : 30,
        extendedEarningDays: extendedEarningDays ? Number(extendedEarningDays) : 60,
        minimumWithdrawal: minimumWithdrawal !== undefined ? Number(minimumWithdrawal) : 2000,
        voucherAmount: voucherAmount !== undefined ? Number(voucherAmount) : 500,
        description: description || null,
        features: features ? JSON.stringify(features) : null
      }
    });

    // Create commission structure if provided
    if (commissions && Array.isArray(commissions)) {
      for (const commission of commissions) {
        await prisma.referralCommission.create({
          data: {
            membershipPlanId: plan.id,
            level: Number(commission.level),
            amount: Number(commission.amount),
            percentage: (Number(commission.amount) / Number(price)) * 100,
            description: commission.description
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      plan,
      message: 'Membership plan created successfully'
    });

  } catch (error: any) {
    console.error('Error creating membership plan:', error);
    const msg = typeof error?.message === 'string' ? error.message : 'Failed to create membership plan';
    // Likely validation/constraint errors
    return NextResponse.json(
      { success: false, error: msg.includes('Admin access required') ? 'Unauthorized' : msg },
      { status: msg.includes('Unauthorized') ? 401 as any : 500 }
    );
  }
}
