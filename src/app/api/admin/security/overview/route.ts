import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin()

    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [totalUsers, activeUsers, admins, blockedUsers, blocksCount, passwordResets24h, recentPasswordResets, recentBlocks] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.userBlock.count(),
      prisma.passwordReset.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.passwordReset.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.userBlock.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ])

    return NextResponse.json({
      stats: { totalUsers, activeUsers, admins, blockedUsers, blocksCount, passwordResets24h },
      recent: { passwordResets: recentPasswordResets, blocks: recentBlocks },
    })
  } catch (error) {
    console.error('Security overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
