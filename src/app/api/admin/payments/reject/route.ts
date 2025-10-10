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
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
    }

    // Update payment status to rejected
    const updatedPayment = await prisma.transaction.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          rejectedAt: new Date().toISOString(),
          rejectedBy: session.user.id
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment request rejected'
    }, { headers })

  } catch (error) {
    console.error('Payment rejection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers })
  }
}
