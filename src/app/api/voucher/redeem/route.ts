import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db as prisma } from '@/lib/db';

// Temporary allowlist of voucher codes for redemption
// NOTE: For production, move this to database or secure KMS-backed storage
const ALLOWED_CODES: Record<string, { amount: number }> = {
  '1df75524e98343c3a768afb130d3ca83': { amount: 1000 },
  'c3da189bd10841368679559160fe74bb': { amount: 1000 },
};

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
    }

    // Basic format validation (32-hex)
    const hex32 = /^[a-fA-F0-9]{32}$/;
    if (!hex32.test(code)) {
      return NextResponse.json({ error: 'Invalid voucher code format' }, { status: 400 });
    }

    // Check allowlist
    const entry = ALLOWED_CODES[code.toLowerCase()];
    if (!entry) {
      return NextResponse.json({ error: 'Voucher code not recognized' }, { status: 404 });
    }

    // Ensure code not already used
    const existing = await prisma.transaction.findFirst({
      where: {
        type: 'VOUCHER_REDEEM',
        reference: code.toLowerCase(),
      },
      select: { id: true, userId: true },
    });

    if (existing) {
      return NextResponse.json({ error: 'This voucher code has already been redeemed' }, { status: 409 });
    }

    // Redeem within a transaction
    const { amount } = entry;
    const result = await prisma.$transaction(async (tx) => {
      // Increment user's voucher balance
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          availableVoucherPkr: { increment: amount },
        },
        select: { availableVoucherPkr: true },
      });

      // Log a transaction entry for audit
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          type: 'VOUCHER_REDEEM',
          amount,
          description: `Voucher redeemed: ${code.toLowerCase()}`,
          status: 'COMPLETED',
          reference: code.toLowerCase(),
        },
      });

      return { voucherBalance: user.availableVoucherPkr };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Voucher redeem error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
