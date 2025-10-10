import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use select to minimize data transfer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        balance: true,
        totalEarnings: true,
        availableVoucherPkr: true,
        membershipPlan: true,
        membershipStatus: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parallel queries for better performance
    const [taskEarnings, tasksCompleted] = await Promise.all([
      prisma.taskCompletion.aggregate({
        where: { userId: session.user.id },
        _sum: { reward: true }
      }),
      prisma.taskCompletion.count({
        where: { userId: session.user.id }
      })
    ]);

    // Earnings breakdown: task earnings and referral commissions (stored in totalEarnings)
    const taskEarningsSum = taskEarnings._sum.reward || 0;
    const referralCommission = user.totalEarnings || 0;
    const totalEarnings = taskEarningsSum + referralCommission;

    // Determine voucher balance
    let voucherBalance = user.availableVoucherPkr || 0;
    if (voucherBalance === 0 && user.membershipPlan && user.membershipStatus === 'ACTIVE') {
      const plan = await prisma.membershipPlan.findUnique({
        where: { name: user.membershipPlan },
        select: { voucherAmount: true }
      });
      voucherBalance = plan?.voucherAmount || 0;
    }

    const walletData = {
      balance: user.balance || 0,
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
