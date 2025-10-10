import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      console.log('Unauthorized access attempt:', { session: session?.user })
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401, headers })
    }
    
    console.log('Admin access granted:', { user: session.user, isAdmin: session.user.isAdmin })

    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
    }

    // Get the payment request
    const payment = await prisma.transaction.findUnique({
      where: { id: paymentId },
      include: { user: true }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
    }

    // Start transaction to approve payment and add voucher balance
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.transaction.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            approvedAt: new Date().toISOString(),
            approvedBy: session.user.id
          })
        }
      })

      // Calculate voucher amount (50% of payment for Rs 1000 payment)
      const voucherAmount = payment.amount >= 1000 ? 500 : payment.amount * 0.5

      // Add voucher balance to user
      const updatedUser = await tx.user.update({
        where: { id: payment.userId },
        data: {
          availableVoucherPkr: {
            increment: voucherAmount
          }
        }
      })

      // Create voucher transaction record
      const voucherTransaction = await tx.transaction.create({
        data: {
          userId: payment.userId,
          type: 'VOUCHER_CREDIT',
          amount: voucherAmount,
          description: `Voucher balance credited for payment approval - Payment ID: ${paymentId}`,
          status: 'COMPLETED',
          metadata: JSON.stringify({
            originalPaymentId: paymentId,
            originalAmount: payment.amount,
            voucherPercentage: payment.amount >= 1000 ? 50 : 50
          })
        }
      })

      return {
        payment: updatedPayment,
        user: updatedUser,
        voucherTransaction
      }
    })

    return NextResponse.json({
      success: true,
      message: `Payment approved and PKR ${result.voucherTransaction.amount} voucher balance added`,
      voucherAmount: result.voucherTransaction.amount
    }, { headers })

  } catch (error) {
    console.error('Payment approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
