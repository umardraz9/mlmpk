import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            balance: true,
            totalEarnings: true,
            referralCode: true,
            sponsorId: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Parse items JSON
    const orderWithParsedItems = {
      ...order,
      items: JSON.parse(order.items || '[]')
    }

    // Get sponsor information if exists
    let sponsor = null
    if (order.user.sponsorId) {
      sponsor = await prisma.user.findUnique({
        where: { id: order.user.sponsorId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          referralCode: true
        }
      })
    }

    // Get user's order history
    const userOrderHistory = await prisma.order.findMany({
      where: { 
        userId: order.userId,
        id: { not: order.id }
      },
      select: {
        id: true,
        orderNumber: true,
        totalPkr: true,
        status: true,
        paymentStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Find any linked manual payments for this order
    let manualPayments = [] as Array<{ id: string; amount: number; status: string; transactionId: string | null; paymentProof: string | null; createdAt: Date; verifiedAt: Date | null }>
    try {
      manualPayments = await prisma.manualPayment.findMany({
        where: {
          userId: order.userId,
          OR: [
            { transactionId: `ORDER-${order.orderNumber}` },
            { adminNotes: { contains: order.orderNumber } },
            { adminNotes: { contains: order.id } },
          ],
        },
        select: {
          id: true,
          amount: true,
          status: true,
          transactionId: true,
          paymentProof: true,
          createdAt: true,
          verifiedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (e) {
      console.warn('Failed to fetch linked manual payments for order', order.id, e)
    }

    return NextResponse.json({
      ...orderWithParsedItems,
      user: {
        ...orderWithParsedItems.user,
        sponsor
      },
      orderHistory: userOrderHistory,
      manualPayments,
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const {
      status,
      paymentStatus,
      trackingNumber,
      notes,
      shippingAddress,
      city,
      paidAmountPkr,
      shippingPkr
    } = data

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (status !== undefined) updateData.status = status
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (notes !== undefined) updateData.notes = notes
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress
    if (city !== undefined) updateData.city = city
    if (paidAmountPkr !== undefined) updateData.paidAmountPkr = paidAmountPkr
    if (shippingPkr !== undefined) updateData.shippingPkr = shippingPkr

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    // Handle status changes
    if (status && status !== existingOrder.status) {
      await handleStatusChange(existingOrder, status, session.user.id)
    }

    // Handle payment status changes
    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
      await handlePaymentStatusChange(existingOrder, paymentStatus, session.user.id)
    }

    return NextResponse.json({
      ...updatedOrder,
      items: JSON.parse(updatedOrder.items || '[]')
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to handle status changes
async function handleStatusChange(order: any, newStatus: string, adminId: string) {
  // Log status change (in a real app, you'd store this in an audit log table)
  console.log(`Order ${order.orderNumber} status changed from ${order.status} to ${newStatus} by admin ${adminId}`)

  // Handle completion logic
  if (newStatus === 'COMPLETED' && order.status !== 'COMPLETED') {
    // Award commissions to sponsors
    await awardCommissions(order)
  }

  // Handle cancellation logic
  if (newStatus === 'CANCELLED') {
    // Refund user balance if payment was made
    if (order.paidAmountPkr > 0) {
      await refundOrder(order)
    }
  }
}

// Helper function to handle payment status changes
async function handlePaymentStatusChange(order: any, newPaymentStatus: string, adminId: string) {
  console.log(`Order ${order.orderNumber} payment status changed from ${order.paymentStatus} to ${newPaymentStatus} by admin ${adminId}`)

  // Handle payment confirmation
  if (newPaymentStatus === 'PAID' && order.paymentStatus !== 'PAID') {
    // Update user's available voucher if vouchers were used
    if (order.voucherUsedPkr > 0) {
      await prisma.user.update({
        where: { id: order.userId },
        data: {
          availableVoucherPkr: {
            decrement: order.voucherUsedPkr
          }
        }
      })
    }
  }
}

// Helper function to award commissions
async function awardCommissions(order: any) {
  try {
    // Calculate commissions for this order
    const commissionAmount = order.totalPkr * 0.1 // 10% commission example
    
    // Award to direct sponsor
    if (order.user.sponsorId) {
      await prisma.user.update({
        where: { id: order.user.sponsorId },
        data: {
          pendingCommission: {
            increment: commissionAmount
          }
        }
      })
    }
  } catch (error) {
    console.error('Error awarding commissions:', error)
  }
}

// Helper function to refund order
async function refundOrder(order: any) {
  try {
    await prisma.user.update({
      where: { id: order.userId },
      data: {
        balance: {
          increment: order.paidAmountPkr
        }
      }
    })
  } catch (error) {
    console.error('Error processing refund:', error)
  }
} 