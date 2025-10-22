import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session'
;
;
import { db as prisma } from '@/lib/db';

// POST - Report a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.id;
    const currentUserId = session.user.id;
    const { reason, description } = await request.json();

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'Report reason is required' }, { status: 400 });
    }

    // Valid report reasons
    const validReasons = [
      'harassment',
      'spam',
      'inappropriate_content',
      'fake_account',
      'hate_speech',
      'violence',
      'other'
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid report reason' }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already reported this user
    const existingReport = await prisma.userReport.findFirst({
      where: {
        reporterId: currentUserId,
        reportedUserId: targetUserId
      }
    });

    if (existingReport) {
      return NextResponse.json({ 
        error: 'You have already reported this user',
        reportId: existingReport.id
      }, { status: 409 });
    }

    // Create report
    const report = await prisma.userReport.create({
      data: {
        reporterId: currentUserId,
        reportedUserId: targetUserId,
        reason,
        description: description || '',
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: `Report submitted for ${targetUser.name || 'user'}. Our team will review it shortly.`
    });

  } catch (error) {
    console.error('Error reporting user:', error);
    return NextResponse.json({
      error: 'Failed to submit report',
      details: error.message
    }, { status: 500 });
  }
}
