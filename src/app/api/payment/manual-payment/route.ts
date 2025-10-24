import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const admin = createServerSupabaseClient();

    const formData = await request.formData();
    const paymentProof = formData.get('paymentProof') as File;
    const paymentMethodId = (formData.get('paymentMethodId') as string) || null;
    const paymentMethodName = (formData.get('paymentMethodName') as string) || 'Manual Payment';
    const amount = formData.get('amount') as string;
    const orderId = (formData.get('orderId') as string) || '';
    const orderNumber = (formData.get('orderNumber') as string) || '';
    const providedTxn = (formData.get('transactionId') as string) || '';

    if (!paymentProof || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: paymentProof, amount' 
      }, { status: 400 });
    }

    // Validate payment method from PaymentSettings if present. If missing, allow submission (fallback/default methods)
    const { data: wallet, error: walletError } = await admin
      .from('payment_settings')
      .select('*')
      .eq('id', paymentMethodId)
      .single();
    if (walletError) {
      // Non-fatal: allow submission even if lookup fails
      console.warn('Payment settings lookup failed:', walletError);
    }
    if (wallet && wallet.isActive === false) {
      return NextResponse.json({ error: 'Inactive payment method' }, { status: 400 });
    }

    // If no matching PaymentSetting exists, avoid FK violation by not setting paymentMethodId
    const resolvedPaymentMethodId = wallet?.id || null;

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
    const { data: userById } = await admin.from('users').select('id').eq('id', userId).single();
    if (!userById) {
      if (session.user.email) {
        const { data: byEmail } = await admin.from('users').select('id').eq('email', session.user.email).single();
        if (byEmail?.id) {
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
    meta.paymentMethod = paymentMethodName;

    // Create manual payment record (align with schema)
    const paymentId = `mp-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Build payment record - paymentMethodId can be null if no matching payment setting
    const now = new Date().toISOString();
    const paymentRecord: Record<string, unknown> = {
      id: paymentId,
      userId,
      paymentMethodId: resolvedPaymentMethodId, // Can be null
      amount: parseFloat(amount),
      transactionId: providedTxn || `TXN-${timestamp}`,
      paymentProof: `/uploads/payments/${fileName}`,
      status: 'PENDING',
      adminNotes: Object.keys(meta).length > 0 ? JSON.stringify(meta) : null,
      createdAt: now,
      updatedAt: now
    };
    
    const { data: manualPayment, error: mpError } = await admin
      .from('manual_payments')
      .insert([paymentRecord])
      .select()
      .single();
    if (mpError || !manualPayment) {
      console.error('Error creating manual payment:', mpError);
      console.error('Payment record attempted:', paymentRecord);
      return NextResponse.json({ error: 'Failed to record payment: ' + (mpError?.message || 'Unknown error') }, { status: 500 });
    }

    // Notify admin to review payment
    try {
      const { data: admins } = await admin
        .from('users')
        .select('id')
        .or('role.eq.ADMIN,isAdmin.eq.true');
      if (admins && admins.length > 0) {
        const notif = admins.map(a => ({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          userId: a.id,
          title: 'New Order Payment Proof',
          message: `A new manual payment proof was submitted for PKR ${amount}.`,
          type: 'payment',
          read: false,
          createdAt: new Date().toISOString(),
          data: JSON.stringify({ paymentId: manualPayment.id, orderId, orderNumber, paymentMethodId })
        }));
        await admin.from('notifications').insert(notif);
      }
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
