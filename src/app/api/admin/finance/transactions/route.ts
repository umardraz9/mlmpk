import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// GET /api/admin/finance/transactions
// Query params: type, status, search, limit, offset
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const limit = Number(searchParams.get('limit') || 100)
    const offset = Number(searchParams.get('offset') || 0)

    const where: Record<string, unknown> = {}
    // Map UI type filter to DB values
    if (type && type !== 'all') {
      const typeUpper = type.toUpperCase()
      if (typeUpper === 'REFUND') {
        ;(where as any).OR = [
          { type: 'REFUND' },
          { type: 'WITHDRAWAL_REFUND' },
        ]
      } else {
        ;(where as any).type = typeUpper
      }
    }
    if (status && status !== 'all') (where as any).status = status.toUpperCase()

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' as const } },
        { user: { is: { name: { contains: search, mode: 'insensitive' as const } } } },
        { user: { is: { email: { contains: search, mode: 'insensitive' as const } } } },
      ]
    }

    const transactions = await prisma.transaction.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      take: limit,
      skip: offset,
    })

    const mapped = transactions.map(t => ({
      id: t.id,
      type: (t.type || '').toLowerCase().replace('withdrawal_refund', 'refund'),
      amount: t.amount,
      status: (t.status || '').toLowerCase(),
      userId: t.userId,
      user: { name: t.user?.name ?? null, email: t.user?.email ?? '' },
      description: t.description ?? '',
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))

    return NextResponse.json({ transactions: mapped })
  } catch (error) {
    console.error('Finance transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
