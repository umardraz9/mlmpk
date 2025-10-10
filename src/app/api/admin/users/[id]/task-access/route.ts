import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

// PUT - Toggle user task system access
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdmin()

    const { enabled } = await request.json()

    // Update user task access
    const user = await prisma.user.update({
      where: { id },
      data: {
        tasksEnabled: enabled
      },
      select: {
        id: true,
        name: true,
        email: true,
        tasksEnabled: true,
        balance: true,
        totalPoints: true,
        tasksCompleted: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        totalEarnings: user.balance + user.totalPoints
      }
    })
  } catch (error) {
    console.error('Error toggling task access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
