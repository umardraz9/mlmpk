import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const { data: paymentConfirmations } = await supabase
      .from('payment_confirmations')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    // Enrich with membership plan details (membershipPlan stores plan ID string)
    const enriched = await Promise.all(
      (paymentConfirmations || []).map(async (pc: any) => {
        let plan = null;
        try {
          // Try by ID first
          const { data: planById } = await supabase
            .from('membership_plans')
            .select('*')
            .eq('id', pc.membershipPlan)
            .single();
          plan = planById;
          if (!plan) {
            // Fallback: treat stored value as plan name
            const { data: planByName } = await supabase
              .from('membership_plans')
              .select('*')
              .eq('name', pc.membershipPlan)
              .single();
            plan = planByName;
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
    let { data: membershipPlan } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', membershipPlanId)
      .single();
    
    if (!membershipPlan) {
      const { data: planByName } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('name', membershipPlanId)
        .single();
      membershipPlan = planByName;
    }
    
    if (!membershipPlan) {
      return NextResponse.json({
        success: false,
        error: 'Membership plan not found'
      }, { status: 404 });
    }

    // Check if user already has a pending confirmation for this plan
    const { data: existingConfirmation } = await supabase
      .from('payment_confirmations')
      .select('*')
      .eq('userId', userId)
      .eq('membershipPlan', membershipPlanId)
      .eq('status', 'PENDING')
      .single();

    if (existingConfirmation) {
      return NextResponse.json({
        success: false,
        error: 'You already have a pending payment confirmation for this plan'
      }, { status: 400 });
    }

    // Check if user already has an active membership
    const { data: currentUser } = await supabase
      .from('users')
      .select('membershipStatus')
      .eq('id', userId)
      .single();
    
    if (currentUser?.membershipStatus === 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'You already have an active membership plan'
      }, { status: 400 });
    }

    // Enforce monthly wallet limit for the selected payment method (PaymentSettings ID)
    // We store the payment method identifier in the paymentConfirmation.paymentMethod string field
    // and use it to aggregate monthly usage per wallet.
    const { data: setting, error: settingError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('id', paymentMethod)
      .single();

    if (settingError || !setting) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
    }

    const monthlyLimit = (setting as any).monthlyLimitPkr as number | null | undefined;
    const amountValue = typeof amount === 'number' ? amount : parseFloat(amount);
    if (monthlyLimit && monthlyLimit > 0) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

      const { data: monthlyPayments } = await supabase
        .from('payment_confirmations')
        .select('amount')
        .eq('paymentMethod', paymentMethod)
        .gte('createdAt', monthStart.toISOString())
        .lt('createdAt', nextMonthStart.toISOString());

      const usedThisMonth = (monthlyPayments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const wouldBeTotal = usedThisMonth + amountValue;
      if (wouldBeTotal > monthlyLimit) {
        const remaining = Math.max(0, monthlyLimit - usedThisMonth);
        return NextResponse.json({
          success: false,
          error: `This wallet has a monthly limit of PKR ${monthlyLimit.toLocaleString()}. Remaining capacity this month: PKR ${remaining.toLocaleString()}. Please choose another method or try next month.`,
        }, { status: 400 });
      }
    }

    const { data: paymentConfirmation, error: createError } = await supabase
      .from('payment_confirmations')
      .insert({
        userId,
        membershipPlan: membershipPlanId,
        paymentMethod,
        transactionId,
        paymentDetails: transactionId,
        amount: typeof amount === 'number' ? amount : parseFloat(amount),
        paymentProof: paymentProof || null,
        notes: notes || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (createError || !paymentConfirmation) {
      console.error('Error creating payment confirmation:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment confirmation' },
        { status: 500 }
      );
    }

    // Create notification for the user (and can be surfaced to admins via admin notifications page)
    await supabase.from('notifications').insert({
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
