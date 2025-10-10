import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const paymentConfirmations = await prisma.paymentConfirmation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich with membership plan details (membershipPlan stores plan ID string)
    const enriched = await Promise.all(
      paymentConfirmations.map(async (pc) => {
        let plan = null as any;
        try {
          // Try by ID first
          plan = await prisma.membershipPlan.findUnique({ where: { id: pc.membershipPlan } });
          if (!plan) {
            // Fallback: treat stored value as plan name
            plan = await prisma.membershipPlan.findFirst({ where: { name: pc.membershipPlan } });
          }
        } catch {}

        return {
          ...pc,
          membershipPlan: {
            displayName: plan?.displayName || pc.membershipPlan,
            price: plan?.price ?? 0,
          },
        };
      })
    );

    return NextResponse.json({ success: true, confirmations: enriched });

  } catch (error) {
    console.error('Error fetching payment confirmations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await request.json();
    const {
      membershipPlanId,
      paymentMethod,
      transactionId,
      amount,
      paymentProof,
      notes
    } = body;

    // Validation
    if (!membershipPlanId || !paymentMethod || !transactionId || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Membership plan, payment method, transaction ID, and amount are required'
      }, { status: 400 });
    }

    // Check if membership plan exists (accept both plan ID and plan name for flexibility)
    let membershipPlan = await prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId }
    });
    if (!membershipPlan) {
      membershipPlan = await prisma.membershipPlan.findFirst({ where: { name: membershipPlanId } });
    }
    if (!membershipPlan) {
      return NextResponse.json({
        success: false,
        error: 'Membership plan not found'
      }, { status: 404 });
    }

    // Check if user already has a pending confirmation for this plan
    const existingConfirmation = await prisma.paymentConfirmation.findFirst({
      where: {
        userId,
        membershipPlan: membershipPlanId,
        status: 'PENDING',
      },
    });

    if (existingConfirmation) {
      return NextResponse.json({
        success: false,
        error: 'You already have a pending payment confirmation for this plan'
      }, { status: 400 });
    }

    // Check if user already has an active membership
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (currentUser?.membershipStatus === 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'You already have an active membership plan'
      }, { status: 400 });
    }

    // Enforce monthly wallet limit for the selected payment method (PaymentSettings ID)
    // We store the payment method identifier in the paymentConfirmation.paymentMethod string field
    // and use it to aggregate monthly usage per wallet.
    const setting = await prisma.paymentSettings.findUnique({ where: { id: paymentMethod } });

    if (!setting) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
    }

    const monthlyLimit = (setting as any).monthlyLimitPkr as number | null | undefined;
    const amountValue = typeof amount === 'number' ? amount : parseFloat(amount);
    if (monthlyLimit && monthlyLimit > 0) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

      const agg = await prisma.paymentConfirmation.aggregate({
        _sum: { amount: true },
        where: {
          paymentMethod: paymentMethod,
          createdAt: { gte: monthStart, lt: nextMonthStart },
        },
      });

      const usedThisMonth = agg._sum.amount || 0;
      const wouldBeTotal = usedThisMonth + amountValue;
      if (wouldBeTotal > monthlyLimit) {
        const remaining = Math.max(0, monthlyLimit - usedThisMonth);
        return NextResponse.json({
          success: false,
          error: `This wallet has a monthly limit of PKR ${monthlyLimit.toLocaleString()}. Remaining capacity this month: PKR ${remaining.toLocaleString()}. Please choose another method or try next month.`,
        }, { status: 400 });
      }
    }

    const paymentConfirmation = await prisma.paymentConfirmation.create({
      data: {
        userId,
        membershipPlan: membershipPlanId, // store plan ID in string field
        paymentMethod,
        transactionId,
        paymentDetails: transactionId, // required by schema
        amount: typeof amount === 'number' ? amount : parseFloat(amount),
        paymentProof: paymentProof || null,
        notes: notes || null,
        status: 'PENDING',
      },
    });

    // Create notification for the user (and can be surfaced to admins via admin notifications page)
    await prisma.notification.create({
      data: {
        recipientId: userId,
        type: 'info',
        category: 'payment',
        title: 'Payment Confirmation Submitted',
        message: `Payment confirmation submitted for ${membershipPlan.displayName} plan. Amount: Rs.${amount}`,
        data: JSON.stringify({
          paymentConfirmationId: paymentConfirmation.id,
          membershipPlanId,
          amount,
          transactionId
        })
      }
    });

    return NextResponse.json({
      success: true,
      confirmation: paymentConfirmation,
      message: 'Payment confirmation submitted successfully. Please wait for admin verification.'
    });

  } catch (error) {
    console.error('Error creating payment confirmation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
