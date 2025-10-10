import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db as prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const userId = session.user.id;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all referrals up to 5 levels deep
    const getReferralsAtLevel = async (userIds: string[], level: number): Promise<any[]> => {
      if (level > 5 || userIds.length === 0) return [];
      
      const referrals = await prisma.user.findMany({
        where: { referredBy: { in: userIds } },
        select: { id: true }
      });
      
      const nextLevelReferrals = await getReferralsAtLevel(
        referrals.map(r => r.id), 
        level + 1
      );
      
      return [...referrals, ...nextLevelReferrals];
    };

    // Get direct referrals
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: userId },
      select: { id: true }
    });

    // Get referrals for each level
    const level1Users = await prisma.user.findMany({
      where: { referredBy: userId },
      select: { id: true }
    });

    const level2Users = await prisma.user.findMany({
      where: { referredBy: { in: level1Users.map(u => u.id) } },
      select: { id: true }
    });

    const level3Users = await prisma.user.findMany({
      where: { referredBy: { in: level2Users.map(u => u.id) } },
      select: { id: true }
    });

    const level4Users = await prisma.user.findMany({
      where: { referredBy: { in: level3Users.map(u => u.id) } },
      select: { id: true }
    });

    const level5Users = await prisma.user.findMany({
      where: { referredBy: { in: level4Users.map(u => u.id) } },
      select: { id: true }
    });

    // Get commissions for each level
    const getLevelCommissions = async (userIds: string[]) => {
      // Placeholder return since commission model doesn't exist
      return 0;
    };

    const level1Earnings = await getLevelCommissions(level1Users.map(u => u.id));
    const level2Earnings = await getLevelCommissions(level2Users.map(u => u.id));
    const level3Earnings = await getLevelCommissions(level3Users.map(u => u.id));
    const level4Earnings = await getLevelCommissions(level4Users.map(u => u.id));
    const level5Earnings = await getLevelCommissions(level5Users.map(u => u.id));

    // Get pending commissions
    // Placeholder for pending commissions since commission model doesn't exist
    const totalPending = 0;

    // Calculate total earnings
    const totalEarnings = level1Earnings + level2Earnings + level3Earnings + level4Earnings + level5Earnings;

    const stats = {
      totalReferrals: level1Users.length + level2Users.length + level3Users.length + level4Users.length + level5Users.length,
      directReferrals: level1Users.length,
      level1Count: level1Users.length,
      level2Count: level2Users.length,
      level3Count: level3Users.length,
      level4Count: level4Users.length,
      level5Count: level5Users.length,
      totalEarnings: totalEarnings,
      level1Earnings: level1Earnings,
      level2Earnings: level2Earnings,
      level3Earnings: level3Earnings,
      level4Earnings: level4Earnings,
      level5Earnings: level5Earnings,
      pendingCommissions: totalPending,
      referralCode: user.referralCode
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
