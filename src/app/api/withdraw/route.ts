import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/session';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { amount, method, accountDetails } = await request.json();

    // Validate input
    if (!amount || !method || !accountDetails) {
      return NextResponse.json(
        { error: 'Amount, payment method, and account details are required' },
        { status: 400 }
      );
    }

    // Get user details with membership plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        balance: true,
        membershipPlan: true,
        membershipStatus: true,
        minimumWithdrawal: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has sufficient balance (excludes voucher balance - vouchers are non-withdrawable)
    if (user.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance. Note: Voucher balance cannot be withdrawn, only used for shopping.' },
        { status: 400 }
      );
    }

    // Determine plan-specific minimum withdrawal amount (always enforce plan min if available)
    let minimumWithdrawal = user.minimumWithdrawal ?? 2000; // fallback
    if (user.membershipPlan) {
      const plan = await prisma.membershipPlan.findUnique({
        where: { name: user.membershipPlan },
        select: { minimumWithdrawal: true }
      });
      if (plan?.minimumWithdrawal) {
        minimumWithdrawal = plan.minimumWithdrawal;
      } else {
        // Fallback when plan not found in DB
        const planName = String(user.membershipPlan).toUpperCase();
        const FALLBACK: Record<string, number> = {
          BASIC: 2000,
          STANDARD: 4000,
          PREMIUM: 10000,
        };
        if (FALLBACK[planName] != null) {
          minimumWithdrawal = FALLBACK[planName];
        }
      }
    }

    // Check minimum withdrawal amount
    if (amount < minimumWithdrawal) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is Rs ${minimumWithdrawal.toLocaleString()} for your plan. Please request at least Rs ${minimumWithdrawal.toLocaleString()}.` },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        amount,
        paymentMethod: method,
        paymentDetails: JSON.stringify(accountDetails),
        status: 'PENDING',
        transactionId: 'WD_' + Math.random().toString(36).substr(2, 9),
      }
    });

    // Deduct amount from user balance
    await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: {
          decrement: amount
        }
      }
    });

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal.id,
        amount,
        method,
        status: 'PENDING',
        transactionId: withdrawal.transactionId,
        createdAt: withdrawal.requestedAt,
      }
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await requireAuth();

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { requestedAt: 'desc' }
    });

    return NextResponse.json({ withdrawals });

  } catch (error) {
    console.error('Withdrawal history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal history' },
      { status: 500 }
    );
  }
}
