import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();

    const body = await request.json();
    const { status, adminNotes } = body as { status: 'APPROVED' | 'REJECTED'; adminNotes?: string };

    // Validation
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Valid status (APPROVED or REJECTED) is required'
      }, { status: 400 });
    }

    // Check if payment confirmation exists
    const existingConfirmation = await prisma.paymentConfirmation.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!existingConfirmation) {
      return NextResponse.json({
        success: false,
        error: 'Payment confirmation not found'
      }, { status: 404 });
    }

    if (existingConfirmation.status !== 'PENDING') {
      return NextResponse.json({
        success: false,
        error: 'Payment confirmation has already been processed'
      }, { status: 400 });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment confirmation (map APPROVED to VERIFIED in our schema)
      const updatedConfirmation = await tx.paymentConfirmation.update({
        where: { id: params.id },
        data: {
          status: status === 'APPROVED' ? 'VERIFIED' : 'REJECTED',
          adminNotes: adminNotes || null,
          verifiedAt: new Date(),
          verifiedBy: session.user.id
        },
        include: { user: true }
      });

      if (status === 'APPROVED') {
        // Resolve plan by ID first, fallback to name
        const plan = await tx.membershipPlan.findUnique({ where: { id: existingConfirmation.membershipPlan } })
          || await tx.membershipPlan.findFirst({ where: { name: existingConfirmation.membershipPlan } });

        const maxDays = plan?.maxEarningDays ?? 30;
        const voucherAmount = plan?.voucherAmount ?? 0;
        const now = new Date();
        const endDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

        await tx.user.update({
          where: { id: existingConfirmation.userId },
          data: {
            membershipPlan: plan ? plan.name : existingConfirmation.membershipPlan,
            membershipStatus: 'ACTIVE',
            membershipStartDate: now,
            membershipEndDate: endDate,
            earningsContinueUntil: endDate,
            minimumWithdrawal: plan?.minimumWithdrawal ?? 2000,
            tasksEnabled: true,
            ...(voucherAmount > 0 ? { availableVoucherPkr: { increment: voucherAmount } } : {})
          }
        });

        if (voucherAmount > 0) {
          await tx.transaction.create({
            data: {
              userId: existingConfirmation.userId,
              type: 'VOUCHER_CREDIT',
              amount: voucherAmount,
              description: `Product voucher for ${(plan?.displayName) || existingConfirmation.membershipPlan} membership`,
              status: 'COMPLETED'
            }
          });
        }

        await tx.notification.create({
          data: {
            recipientId: existingConfirmation.userId,
            type: 'MEMBERSHIP_ACTIVATED',
            title: 'Membership Activated!',
            message: `Your ${(plan?.displayName) || existingConfirmation.membershipPlan} membership has been activated. You can now start tasks!`,
            data: JSON.stringify({
              membershipPlan: plan?.name || existingConfirmation.membershipPlan,
              dailyEarning: plan?.dailyTaskEarning ?? null,
              voucherAmount
            })
          }
        });
      } else {
        await tx.notification.create({
          data: {
            recipientId: existingConfirmation.userId,
            type: 'PAYMENT_REJECTED',
            title: 'Payment Confirmation Rejected',
            message: `Your payment confirmation for ${existingConfirmation.membershipPlan} has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : 'Please contact support for more details.'}`,
            data: JSON.stringify({
              membershipPlan: existingConfirmation.membershipPlan,
              rejectionReason: adminNotes
            })
          }
        });
      }

      return updatedConfirmation;
    });

    return NextResponse.json({
      success: true,
      confirmation: result,
      message: `Payment confirmation ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Error processing payment confirmation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
