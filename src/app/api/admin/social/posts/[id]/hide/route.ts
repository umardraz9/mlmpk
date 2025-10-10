import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const id = params.id
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })

    await prisma.socialPost.update({ where: { id }, data: { status: 'HIDDEN' } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error hiding post', e)
    return NextResponse.json({ success: false, error: 'Failed to hide post' }, { status: 500 })
  }
}
