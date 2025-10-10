import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db as prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const userId = session.user.id;

    // Build the user's MLM network tree
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Get all referrals recursively
    const getReferralsRecursive = async (userId: string): Promise<any[]> => {
      const directReferrals = await prisma.user.findMany({
        where: { referredBy: userId }
      });

      const referralsWithChildren = await Promise.all(
        directReferrals.map(async (referral) => {
          const children = await getReferralsRecursive(referral.id);
          return {
            ...referral,
            children
          };
        })
      );

      return referralsWithChildren;
    };

    const referrals = await getReferralsRecursive(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate earnings for each node
    const calculateNodeEarnings = async (node: any, level: number = 0): Promise<any> => {
      // For now, return placeholder earnings since commission model doesn't exist
      const commissions = [];

      const totalEarnings = commissions.reduce((sum, commission) => sum + commission.amount, 0);
      const pendingCommission = commissions
        .filter(c => c.status === 'PENDING')
        .reduce((sum, commission) => sum + commission.amount, 0);

      const children = node.referrals ? 
        await Promise.all(node.referrals.map((child: any) => calculateNodeEarnings(child, level + 1))) 
        : [];

      return {
        id: node.id,
        name: node.name,
        email: node.email,
        username: node.username,
        avatar: node.image,
        isActive: node.isActive,
        role: node.role,
        referralCode: node.referralCode,
        balance: node.balance || 0,
        totalEarnings: totalEarnings,
        pendingCommission: pendingCommission,
        referralCount: children.length,
        teamEarnings: children.reduce((sum: number, child: any) => sum + child.totalEarnings, 0),
        children: children,
        level: level,
        joinedAt: node.createdAt,
        lastActive: node.updatedAt
      };
    };

    const networkTree = await calculateNodeEarnings(user, 0);

    return NextResponse.json(networkTree);
  } catch (error) {
    console.error('Error fetching MLM network:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
