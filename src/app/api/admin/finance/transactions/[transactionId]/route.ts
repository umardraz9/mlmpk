import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export async function PATCH(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    await requireAdmin()

    const { transactionId } = params
    const body = await request.json()
    const { status } = body as { status?: string }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: (status || '').toUpperCase() },
    })

    return NextResponse.json({ transaction: updated })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
