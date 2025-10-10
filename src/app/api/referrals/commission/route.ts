import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/session';

const prisma = new PrismaClient();

// POST /api/referrals/commission - Process referral commission when user joins
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newUserId, membershipPlan } = body;

    // Get the new user who just joined
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId }
    });

    if (!newUser || !newUser.sponsorId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user or no sponsor' },
        { status: 400 }
      );
    }

    // Get membership plan commission structure
    const plan = await prisma.membershipPlan.findUnique({
      where: { name: membershipPlan.toUpperCase() },
      include: {
        referralCommissions: {
          orderBy: { level: 'asc' }
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid membership plan' },
        { status: 400 }
      );
    }

    const commissions = [];
    let currentUserId = newUser.sponsorId;

    // Process commissions for up to 5 levels
    for (let level = 1; level <= 5 && currentUserId; level++) {
      const sponsor = await prisma.user.findUnique({
        where: { id: currentUserId }
      });

      if (!sponsor) break;

      // Find commission for this level
      const levelCommission = plan.referralCommissions.find(c => c.level === level);
      if (!levelCommission || !levelCommission.isActive) {
        currentUserId = sponsor.sponsorId;
        continue;
      }

      // Award commission to sponsor
      const updatedSponsor = await prisma.user.update({
        where: { id: sponsor.id },
        data: {
          referralEarnings: sponsor.referralEarnings + levelCommission.amount,
          totalEarnings: sponsor.totalEarnings + levelCommission.amount,
          balance: sponsor.balance + levelCommission.amount
        }
      });

      // Create referral earning history
      await prisma.referralEarningHistory.create({
        data: {
          userId: sponsor.id,
          referredUserId: newUser.id,
          membershipPlan: membershipPlan.toUpperCase(),
          level: level,
          amount: levelCommission.amount
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: sponsor.id,
          type: 'REFERRAL_COMMISSION',
          amount: levelCommission.amount,
          description: `Level ${level} referral commission from ${newUser.name || newUser.email}`,
          status: 'COMPLETED',
          reference: `${newUser.id}:${membershipPlan.toUpperCase()}:L${level}`
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          title: `Level ${level} Commission Earned!`,
          message: `You earned Rs.${levelCommission.amount} commission from ${newUser.name || 'new member'}'s ${plan.displayName} purchase.`,
          type: 'success',
          recipientId: sponsor.id
        }
      });

      // Extend earning period if this is a direct referral (level 1)
      if (level === 1 && sponsor.membershipStatus === 'ACTIVE' && sponsor.earningsContinueUntil) {
        const sponsorPlan = sponsor.membershipPlan?.toUpperCase() || ''
        const referredPlan = String(membershipPlan).toUpperCase()

        // Apply plan-specific extension rules
        let qualifiesForExtension = false
        if (sponsorPlan === 'BASIC') {
          qualifiesForExtension = ['BASIC','STANDARD','PREMIUM'].includes(referredPlan)
        } else if (sponsorPlan === 'STANDARD') {
          qualifiesForExtension = ['STANDARD','PREMIUM'].includes(referredPlan)
        } else if (sponsorPlan === 'PREMIUM') {
          qualifiesForExtension = referredPlan === 'PREMIUM'
        }

        if (qualifiesForExtension) {
          const planDetails = await prisma.membershipPlan.findUnique({
            where: { name: sponsorPlan }
          });
          if (planDetails && sponsor.membershipStartDate) {
            const newEndDate = new Date(sponsor.membershipStartDate);
            newEndDate.setDate(newEndDate.getDate() + planDetails.extendedEarningDays);

            // Only update if this extends the current window further
            const shouldUpdate = !sponsor.earningsContinueUntil || newEndDate > sponsor.earningsContinueUntil
            if (shouldUpdate) {
              await prisma.user.update({
                where: { id: sponsor.id },
                data: { earningsContinueUntil: newEndDate }
              })

              // Notify about extended earning period
              await prisma.notification.create({
                data: {
                  title: 'Earning Period Extended!',
                  message: `Your earning period has been extended to ${newEndDate.toLocaleDateString()} due to your successful referral!`,
                  type: 'info',
                  recipientId: sponsor.id
                }
              })
            }
          }
        }
      }

      commissions.push({
        level,
        sponsorId: sponsor.id,
        sponsorEmail: sponsor.email,
        amount: levelCommission.amount
      });

      // Move to next level
      currentUserId = sponsor.sponsorId;
    }

    return NextResponse.json({
      success: true,
      commissions,
      totalCommissionPaid: commissions.reduce((sum, c) => sum + c.amount, 0),
      message: `Referral commissions processed for ${commissions.length} levels`
    });

  } catch (error) {
    console.error('Error processing referral commission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process referral commission' },
      { status: 500 }
    );
  }
}

// GET /api/referrals/commission - Get user's referral commission history
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get referral earning history
    const history = await prisma.referralEarningHistory.findMany({
      where: { userId: user.id },
      orderBy: { earningDate: 'desc' },
      take: 50 // Limit to last 50 records
    });

    // Get referral statistics
    const stats = await prisma.referralEarningHistory.groupBy({
      by: ['level'],
      where: { userId: user.id },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Get direct referrals count
    const directReferrals = await prisma.user.count({
      where: { sponsorId: user.id }
    });

    return NextResponse.json({
      success: true,
      referralEarnings: {
        total: user.referralEarnings,
        history: history,
        statistics: stats,
        directReferrals: directReferrals
      }
    });

  } catch (error) {
    console.error('Error fetching referral commission history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch commission history' },
      { status: 500 }
    );
  }
}
