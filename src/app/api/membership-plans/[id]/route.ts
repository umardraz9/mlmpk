import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/session';


// GET /api/membership-plans/[id] - Get specific membership plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: params.id },
      include: {
        referralCommissions: {
          orderBy: { level: 'asc' }
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Membership plan not found' },
        { status: 404 }
      );
    }

    const planWithFeatures = {
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : [],
      totalCommission: plan.referralCommissions.reduce((sum, comm) => sum + comm.amount, 0)
    };

    return NextResponse.json({
      success: true,
      plan: planWithFeatures
    });

  } catch (error) {
    console.error('Error fetching membership plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch membership plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/membership-plans/[id] - Delete membership plan (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    // Ensure the plan exists
    const existing = await prisma.membershipPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Membership plan not found' },
        { status: 404 }
      );
    }

    // Delete the plan. ReferralCommission rows will cascade.
    await prisma.membershipPlan.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      message: 'Membership plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting membership plan:', error);
    if ((error as any)?.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete membership plan' },
      { status: 500 }
    );
  }
}

// PUT /api/membership-plans/[id] - Update membership plan (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const {
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
      isActive
    } = body;

    const plan = await prisma.membershipPlan.update({
      where: { id: params.id },
      data: {
        displayName,
        price: price ? parseFloat(price) : undefined,
        dailyTaskEarning: dailyTaskEarning ? parseFloat(dailyTaskEarning) : undefined,
        tasksPerDay: tasksPerDay ? parseInt(tasksPerDay) : undefined,
        maxEarningDays,
        extendedEarningDays,
        minimumWithdrawal: minimumWithdrawal ? parseFloat(minimumWithdrawal) : undefined,
        voucherAmount: voucherAmount ? parseFloat(voucherAmount) : undefined,
        description,
        features: features ? JSON.stringify(features) : undefined,
        isActive
      }
    });

    return NextResponse.json({
      success: true,
      plan,
      message: 'Membership plan updated successfully'
    });

  } catch (error) {
    console.error('Error updating membership plan:', error);
    if ((error as any)?.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update membership plan' },
      { status: 500 }
    );
  }
}
