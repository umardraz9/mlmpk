import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const reports = await prisma.socialReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        reporter: { select: { id: true, name: true, username: true, avatar: true } },
        post: {
          select: {
            id: true,
            content: true,
            status: true,
            coverUrl: true,
            author: { select: { id: true, name: true, username: true, avatar: true } }
          }
        }
      }
    })

    return NextResponse.json({ success: true, reports })
  } catch (e) {
    console.error('Error fetching social reports', e)
    return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 })
  }
}
