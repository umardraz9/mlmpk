import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

import { db as prisma } from '@/lib/db'

// NOTE: Minimal placeholder implementation.
// In production, persist reports to a DB table and notify moderators.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, reason } = await request.json().catch(() => ({}))
    if (!postId || typeof postId !== 'string') {
      return NextResponse.json({ success: false, error: 'postId is required' }, { status: 400 })
    }

    // Ensure post exists
    const post = await prisma.socialPost.findUnique({ where: { id: postId }, select: { id: true } })
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    // Create the report
    await prisma.socialReport.create({
      data: {
        postId,
        reporterId: session.user.id,
        reason: typeof reason === 'string' ? reason.slice(0, 500) : null,
      }
    })

    return NextResponse.json({ success: true, message: 'Report submitted' })
  } catch (err) {
    console.error('Error submitting report', err)
    return NextResponse.json({ success: false, error: 'Failed to submit report' }, { status: 500 })
  }
}
