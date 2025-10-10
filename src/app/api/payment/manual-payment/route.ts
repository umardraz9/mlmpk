import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await request.formData();
    const paymentProof = formData.get('paymentProof') as File;
    const paymentMethodId = formData.get('paymentMethodId') as string;
    const amount = formData.get('amount') as string;
    const orderId = (formData.get('orderId') as string) || '';
    const orderNumber = (formData.get('orderNumber') as string) || '';
    const providedTxn = (formData.get('transactionId') as string) || '';

    if (!paymentProof || !paymentMethodId || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: paymentProof, paymentMethodId, amount' 
      }, { status: 400 });
    }

    // Validate payment method from PaymentSettings if present. If missing, allow submission (fallback/default methods)
    const wallet = await prisma.paymentSettings.findUnique({ where: { id: paymentMethodId } });
    if (wallet && wallet.isActive === false) {
      return NextResponse.json({ error: 'Inactive payment method' }, { status: 400 });
    }

    // Ensure a corresponding PaymentMethod row exists (for FK compatibility in some DBs)
    // Only when a PaymentSettings record exists
    if (wallet) {
      const normalizedType = wallet.type === 'BANK_ACCOUNT' ? 'BANK_ACCOUNT' : 'MOBILE_WALLET';
      const pmName = wallet.type === 'JAZZCASH'
        ? 'JazzCash'
        : wallet.type === 'EASYPAISA'
          ? 'EasyPaisa'
          : wallet.type === 'BANK_ACCOUNT' && wallet.bankName
            ? `${wallet.bankName} Bank Account`
            : 'Manual Payment';

      await prisma.paymentMethod.upsert({
        where: { id: paymentMethodId },
        update: {
          name: pmName,
          type: normalizedType,
          accountTitle: wallet.accountTitle,
          accountNumber: wallet.accountNumber,
          bankName: wallet.bankName ?? undefined,
          branchCode: wallet.branchCode ?? undefined,
          iban: wallet.iban ?? undefined,
          isActive: true,
          displayOrder: wallet.displayOrder ?? 0,
          instructions: wallet.instructions ?? undefined,
        },
        create: {
          id: paymentMethodId,
          name: pmName,
          type: normalizedType,
          accountTitle: wallet.accountTitle,
          accountNumber: wallet.accountNumber,
          bankName: wallet.bankName ?? undefined,
          branchCode: wallet.branchCode ?? undefined,
          iban: wallet.iban ?? undefined,
          isActive: true,
          isDefault: false,
          displayOrder: wallet.displayOrder ?? 0,
          instructions: wallet.instructions ?? undefined,
        }
      });
    }

    // Validate file type and size
    if (!paymentProof.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Only image files are allowed' 
      }, { status: 400 });
    }

    if (paymentProof.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ 
        error: 'File size must be less than 5MB' 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payments');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Ensure authenticated user exists in DB (avoid FK violations)
    let userId = session.user.id;
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRecord) {
      if (session.user.email) {
        const byEmail = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (byEmail) {
          userId = byEmail.id;
        } else {
          return NextResponse.json({ error: 'Authenticated user not found in database' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'Authenticated user not found in database' }, { status: 400 });
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = paymentProof.name.split('.').pop();
    const fileName = `payment_${session.user.id}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await paymentProof.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Build metadata to help admins link this proof to an order
    const meta: Record<string, string> = {};
    if (orderId || orderNumber) {
      meta.source = 'checkout';
      meta.type = 'ORDER_PAYMENT';
      if (orderId) meta.orderId = orderId;
      if (orderNumber) meta.orderNumber = orderNumber;
    }

    // Create manual payment record (align with schema)
    const manualPayment = await prisma.manualPayment.create({
      data: {
        userId,
        paymentMethodId: paymentMethodId,
        amount: parseFloat(amount),
        transactionId: providedTxn || `TXN-${timestamp}`,
        paymentProof: `/uploads/payments/${fileName}`,
        status: 'PENDING',
        ...(Object.keys(meta).length > 0 ? { adminNotes: JSON.stringify(meta) } : {}),
      },
    });

    // Notify admin to review payment
    try {
      await prisma.notification.create({
        data: {
          title: 'New Order Payment Proof',
          message: `A new manual payment proof was submitted for PKR ${amount}.`,
          type: 'payment',
          category: 'admin',
          priority: 'high',
          role: 'ADMIN',
          data: JSON.stringify({ paymentId: manualPayment.id, orderId, orderNumber, paymentMethodId }),
          actionUrl: '/admin/payments',
          actionText: 'Review Payment',
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully. Your payment is under review.',
      paymentId: manualPayment.id
    });

  } catch (error: unknown) {
    console.error('Manual payment submission error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to submit payment proof';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
