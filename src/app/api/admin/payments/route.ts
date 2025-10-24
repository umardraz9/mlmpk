import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    console.log('Admin access granted:', { user: session.user.email, isAdmin: session.user.isAdmin })

    const { data: manualPayments, error: paymentsError } = await supabase
      .from('manual_payments')
      .select(`
        *,
        user:users(id, name, email, phone, membershipPlan)
      `)
      .order('createdAt', { ascending: false })

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    // Load payment settings for all referenced method IDs in batch
    const ids = Array.from(new Set((manualPayments || []).map(p => p.paymentMethodId).filter(Boolean))) as string[]
    let settingsList: any[] = []
    if (ids.length > 0) {
      const { data } = await supabase.from('payment_settings').select('*').in('id', ids)
      settingsList = data || []
    }
    const settingsById = new Map(settingsList.map(s => [s.id, s]))

    // Optionally resolve approver names based on verifiedBy
    const approverIds = Array.from(new Set((manualPayments || []).map(p => p.verifiedBy).filter(Boolean))) as string[]
    let approvers: any[] = []
    if (approverIds.length > 0) {
      const { data } = await supabase.from('users').select('id, name, email').in('id', approverIds)
      approvers = data || []
    }
    const approverById = new Map(approvers.map(a => [a.id, a]))

    // Map to admin UI shape expected by the page
    const payments = (manualPayments || []).map((p: any) => {
      const s = settingsById.get(p.paymentMethodId)
      const methodName = s
        ? (s.type === 'JAZZCASH' ? 'JazzCash' : s.type === 'EASYPAISA' ? 'EasyPaisa' : s.type === 'BANK_ACCOUNT' ? (s.bankName ? `${s.bankName} Bank` : 'Bank Account') : 'Manual Payment')
        : 'Manual Payment'
      const approver = p.verifiedBy ? approverById.get(p.verifiedBy) || null : null
      // Map status to legacy labels used in UI badges
      const uiStatus = p.status === 'VERIFIED' ? 'APPROVED' : p.status
      return {
        id: p.id,
        userId: p.userId,
        membershipTier: p.user?.membershipPlan || '-',
        amount: p.amount,
        paymentMethod: methodName,
        adminAccount: s?.accountNumber || '',
        userPhone: p.user?.phone || '',
        transactionId: p.transactionId || '',
        screenshot: p.paymentProof || undefined,
        status: uiStatus,
        notes: p.adminNotes || undefined,
        createdAt: p.createdAt,
        approvedAt: p.verifiedAt || undefined,
        approvedBy: p.verifiedBy || undefined,
        user: { name: p.user?.name || '', email: p.user?.email || '' },
        approver: approver ? { name: approver.name || '', email: approver.email || '' } : undefined,
      }
    })

    return NextResponse.json({ payments })

  } catch (error) {
    console.error('Admin payments fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin()

    const { id, action, notes } = await request.json()
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (adminError || !adminUser) {
      console.error('Admin user not found:', adminError)
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    const { data: payment, error: paymentError } = await supabase
      .from('manual_payments')
      .select(`*, user:users(*)`)
      .eq('id', id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (action === 'approve') {
      const { error: updateError } = await supabase
        .from('manual_payments')
        .update({
          status: 'VERIFIED',
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminUser.id,
          adminNotes: notes || null,
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error updating payment:', updateError)
        return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
      }

      // If this manual payment is linked to an order payment (transactionId like ORDER-<orderNumber>),
      // mark the order as PAID
      try {
        const txn = payment?.transactionId || ''
        const maybeOrderNumber = txn.startsWith('ORDER-') ? txn.substring('ORDER-'.length) : ''
        if (maybeOrderNumber) {
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('orderNumber', maybeOrderNumber)
            .single()

          if (order) {
            await supabase
              .from('orders')
              .update({
                paymentStatus: 'PAID',
                notes: order.notes ? `${order.notes}\nPayment verified via manual proof ${id}` : `Payment verified via manual proof ${id}`,
              })
              .eq('id', order.id)
          }
        }
      } catch (e) {
        console.warn('Order payment linking skipped:', e)
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
      const { error: updateError } = await supabase
        .from('manual_payments')
        .update({
          status: 'REJECTED',
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminUser.id,
          adminNotes: notes || null,
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error rejecting payment:', updateError)
        return NextResponse.json({ error: 'Failed to reject payment' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin payment action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
