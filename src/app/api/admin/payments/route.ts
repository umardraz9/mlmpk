import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin()
    console.log('Admin access granted:', { user: session.user.email, isAdmin: session.user.isAdmin })

    const manualPayments = await prisma.manualPayment.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, membershipPlan: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Load payment settings for all referenced method IDs in batch
    const ids = Array.from(new Set(manualPayments.map(p => p.paymentMethodId).filter(Boolean))) as string[]
    const settingsList = ids.length
      ? await prisma.paymentSettings.findMany({ where: { id: { in: ids } } })
      : []
    const settingsById = new Map(settingsList.map(s => [s.id, s]))

    // Optionally resolve approver names based on verifiedBy
    const approverIds = Array.from(new Set(manualPayments.map(p => p.verifiedBy).filter(Boolean))) as string[]
    const approvers = approverIds.length
      ? await prisma.user.findMany({ where: { id: { in: approverIds } }, select: { id: true, name: true, email: true } })
      : []
    const approverById = new Map(approvers.map(a => [a.id, a]))

    // Map to admin UI shape expected by the page
    const payments = manualPayments.map(p => {
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

    const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    const payment = await prisma.manualPayment.findUnique({ where: { id }, include: { user: true } })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (action === 'approve') {
      await prisma.manualPayment.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: adminUser.id,
          adminNotes: notes || undefined,
        }
      })

      // If this manual payment is linked to an order payment (transactionId like ORDER-<orderNumber>),
      // mark the order as PAID and increment paidAmountPkr
      try {
        const refreshed = await prisma.manualPayment.findUnique({ where: { id }, include: { user: true } })
        const txn = refreshed?.transactionId || ''
        const maybeOrderNumber = txn.startsWith('ORDER-') ? txn.substring('ORDER-'.length) : ''
        if (maybeOrderNumber) {
          const order = await prisma.order.findUnique({ where: { orderNumber: maybeOrderNumber } })
          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'PAID',
                paidAmountPkr: { increment: refreshed?.amount || 0 },
                // Optional: append note
                notes: order.notes ? `${order.notes}\nPayment verified via manual proof ${id}` : `Payment verified via manual proof ${id}`,
              },
            })

            // Notify user their order payment was confirmed
            await prisma.notification.create({
              data: {
                title: 'Order Payment Confirmed',
                message: `Your payment for order ${order.orderNumber} has been verified.`,
                type: 'success',
                category: 'order',
                priority: 'high',
                recipientId: order.userId,
                data: JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, paymentId: id }),
                actionUrl: `/orders/${order.id}`,
                actionText: 'View Order',
              },
            })
          }
        }
      } catch (e) {
        console.warn('Order payment linking skipped:', e)
      }

      // Attempt to activate user's membership so they can start tasks
      try {
        // Load latest user including current plan
        const user = await prisma.user.findUnique({ where: { id: payment.userId } })
        let plan = null as any
        if (user?.membershipPlan) {
          plan = await prisma.membershipPlan.findUnique({ where: { name: user.membershipPlan } })
        }
        if (!plan) {
          // Choose a default active plan if user has none
          plan = await prisma.membershipPlan.findFirst({ where: { isActive: true }, orderBy: { price: 'asc' } })
        }

        const now = new Date()
        const endDate = plan ? new Date(now.getTime() + (plan.maxEarningDays * 24 * 60 * 60 * 1000)) : null

        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            membershipStatus: 'ACTIVE',
            tasksEnabled: true,
            ...(plan ? { membershipPlan: plan.name } : {}),
            membershipStartDate: now,
            ...(endDate ? { membershipEndDate: endDate, earningsContinueUntil: endDate } : {}),
            ...(plan ? { minimumWithdrawal: plan.minimumWithdrawal } : {}),
          }
        })
      } catch (e) {
        console.warn('Membership activation after approval failed (non-fatal):', e)
      }

      // Notify user of approval
      await prisma.notification.create({
        data: {
          title: 'Payment Approved',
          message: `Your manual payment of PKR ${payment.amount} has been approved. Your account will be updated shortly.`,
          type: 'payment',
          category: 'user',
          priority: 'high',
          recipientId: payment.userId,
          data: JSON.stringify({ paymentId: payment.id })
        }
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
      await prisma.manualPayment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          verifiedAt: new Date(),
          verifiedBy: adminUser.id,
          adminNotes: notes || undefined,
        }
      })

      // Notify user of rejection
      await prisma.notification.create({
        data: {
          title: 'Payment Rejected',
          message: `Your manual payment of PKR ${payment.amount} has been rejected. Please contact support for assistance.`,
          type: 'payment',
          category: 'user',
          priority: 'high',
          recipientId: payment.userId,
          data: JSON.stringify({ paymentId: payment.id, reason: notes })
        }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin payment action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
