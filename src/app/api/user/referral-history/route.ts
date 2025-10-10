import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db as prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get all referrals up to 5 levels deep
    const getReferralsByLevel = async (userIds: string[], level: number): Promise<any[]> => {
      if (level > 5 || userIds.length === 0) return [];
      
      const referrals = await prisma.user.findMany({
        where: { referredBy: { in: userIds } }
      });

      const nextLevelUserIds = referrals.map(r => r.id);
      const nextLevelReferrals = await getReferralsByLevel(nextLevelUserIds, level + 1);

      const currentLevelReferrals = referrals.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        joinedAt: user.createdAt,
        referredBy: user.referredBy === userId ? 'Direct' : `Level ${level}`,
        level: level,
        status: user.isActive ? 'active' : 'inactive',
        earnings: 0, // Will calculate from commission records
        avatar: user.image
      }));

      return [...currentLevelReferrals, ...nextLevelReferrals];
    };

    // Get all referrals starting from the user
    const allReferrals = await getReferralsByLevel([userId], 1);

    // Sort by date (newest first)
    allReferrals.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

    return NextResponse.json(allReferrals);
  } catch (error) {
    console.error('Error fetching referral history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
