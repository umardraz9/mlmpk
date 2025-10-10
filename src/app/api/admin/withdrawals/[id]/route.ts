import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// GET - Get single withdrawal request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { id } = params

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            balance: true,
          }
        },

      }
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    return NextResponse.json(withdrawal)
  } catch (error) {
    console.error('Error fetching withdrawal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update withdrawal request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin()
    const { id } = params

    const data = await request.json()
    const { status, notes, transactionId, rejectionReason } = data

    if (!['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { balance: true }
        }
      }
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    // Check if already processed
    if (withdrawal.status !== 'PENDING' && status !== 'REJECTED') {
      return NextResponse.json({ error: 'Withdrawal request already processed' }, { status: 400 })
    }

    // Handle approval/completion: do NOT deduct here since amount was deducted at request creation
    if (status === 'APPROVED' || status === 'COMPLETED') {
      // Create transaction record only when completed
      if (status === 'COMPLETED') {
        await prisma.transaction.create({
          data: {
            userId: withdrawal.userId,
            type: 'WITHDRAWAL',
            amount: withdrawal.amount,
            description: `Withdrawal ${status.toLowerCase()}`,
            status: 'COMPLETED',
            reference: transactionId || withdrawal.id
          }
        })
      }
    }

    // Handle rejection - refund balance
    if (status === 'REJECTED') {
      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          balance: {
            increment: withdrawal.amount
          }
        }
      })

      // Create transaction record for refund
      await prisma.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: 'WITHDRAWAL_REFUND',
          amount: withdrawal.amount,
          description: `Withdrawal ${status.toLowerCase()}`,
          status: 'COMPLETED',
          reference: withdrawal.id
        }
      })
    }

    // Update withdrawal request
    const updatedWithdrawal = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status,
        processedAt: new Date(),
        processedBy: session.user.id,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            balance: true,
          }
        }
      }
    })

    return NextResponse.json(updatedWithdrawal)
  } catch (error) {
    console.error('Error updating withdrawal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete withdrawal request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const { id } = params

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id }
    })

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    // Only allow deletion of pending requests
    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cannot delete processed withdrawal request' }, { status: 400 })
    }

    // Refund balance if pending
    await prisma.user.update({
      where: { id: withdrawal.userId },
      data: {
        balance: {
          increment: withdrawal.amount
        }
      }
    })

    // Delete the withdrawal request
    await prisma.withdrawalRequest.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Withdrawal request deleted successfully' })
  } catch (error) {
    console.error('Error deleting withdrawal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
