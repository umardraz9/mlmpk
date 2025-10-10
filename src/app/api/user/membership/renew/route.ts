import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Calculate renewal price based on renewal count (Tiered Renewal - Option 3)
function calculateRenewalPrice(basePrice: number, renewalCount: number): number {
  if (renewalCount === 0) {
    // First renewal: Full price
    return basePrice;
  } else if (renewalCount === 1) {
    // Second renewal: 10% discount
    return Math.round(basePrice * 0.9);
  } else {
    // Third+ renewal: 20% discount
    return Math.round(basePrice * 0.8);
  }
}

// GET /api/user/membership/renew - Get renewal pricing and options
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        membershipPlan: true,
        membershipStatus: true,
        membershipEndDate: true,
        renewalCount: true,
        lastRenewalDate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all available plans for upgrade options
    const allPlans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    // Calculate renewal prices for each plan
    const renewalOptions = allPlans.map(plan => {
      const isCurrentPlan = plan.name === user.membershipPlan;
      const renewalPrice = calculateRenewalPrice(plan.price, user.renewalCount || 0);
      
      let discountPercentage = 0;
      if (user.renewalCount === 0) {
        discountPercentage = 0;
      } else if (user.renewalCount === 1) {
        discountPercentage = 10;
      } else {
        discountPercentage = 20;
      }

      return {
        planName: plan.name,
        displayName: plan.displayName,
        basePrice: plan.price,
        renewalPrice: renewalPrice,
        discountPercentage: discountPercentage,
        savings: plan.price - renewalPrice,
        isCurrentPlan: isCurrentPlan,
        isUpgrade: !isCurrentPlan && plan.price > (allPlans.find(p => p.name === user.membershipPlan)?.price || 0),
        isDowngrade: !isCurrentPlan && plan.price < (allPlans.find(p => p.name === user.membershipPlan)?.price || 0),
        dailyTaskEarning: plan.dailyTaskEarning,
        maxEarningDays: plan.maxEarningDays,
        extendedEarningDays: plan.extendedEarningDays,
        minimumWithdrawal: plan.minimumWithdrawal,
        voucherAmount: plan.voucherAmount,
        features: plan.features ? JSON.parse(plan.features) : []
      };
    });

    // Calculate days until expiration
    const now = new Date();
    const daysUntilExpiration = user.membershipEndDate 
      ? Math.ceil((user.membershipEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return NextResponse.json({
      success: true,
      currentPlan: user.membershipPlan,
      membershipStatus: user.membershipStatus,
      renewalCount: user.renewalCount || 0,
      daysUntilExpiration: daysUntilExpiration,
      canRenew: user.membershipStatus === 'ACTIVE' || user.membershipStatus === 'EXPIRED',
      renewalOptions: renewalOptions
    });

  } catch (error) {
    console.error('Error fetching renewal options:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch renewal options' },
      { status: 500 }
    );
  }
}

// POST /api/user/membership/renew - Renew or upgrade membership
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planName, paymentMethod, paymentDetails, isUpgrade } = body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user can renew
    if (user.membershipStatus !== 'ACTIVE' && user.membershipStatus !== 'EXPIRED') {
      return NextResponse.json(
        { success: false, error: 'No active or expired membership to renew' },
        { status: 400 }
      );
    }

    // Validate plan exists
    const plan = await prisma.membershipPlan.findUnique({
      where: { name: planName.toUpperCase() }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid membership plan' },
        { status: 400 }
      );
    }

    // Calculate renewal price
    const renewalPrice = calculateRenewalPrice(plan.price, user.renewalCount || 0);

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.maxEarningDays);

    // Determine if this is an upgrade
    const isActualUpgrade = isUpgrade || (user.membershipPlan && plan.price > (await prisma.membershipPlan.findUnique({ where: { name: user.membershipPlan } }))?.price!);

    // Update user with renewed/upgraded membership
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        membershipPlan: plan.name,
        membershipStatus: 'ACTIVE',
        membershipStartDate: now,
        membershipEndDate: endDate,
        earningsContinueUntil: endDate,
        minimumWithdrawal: plan.minimumWithdrawal,
        availableVoucherPkr: user.availableVoucherPkr + plan.voucherAmount, // Add new voucher to existing
        renewalCount: isActualUpgrade ? 0 : (user.renewalCount || 0) + 1, // Reset count on upgrade
        lastRenewalDate: now,
        expirationNotified: false, // Reset notification flag
        // Reset daily task counter for new period
        dailyTasksCompleted: 0,
        lastTaskCompletionDate: null
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: isActualUpgrade ? 'MEMBERSHIP_UPGRADE' : 'MEMBERSHIP_RENEWAL',
        amount: -renewalPrice, // Negative because it's a payment
        description: isActualUpgrade 
          ? `Upgraded to ${plan.displayName} (${user.renewalCount || 0} renewals)`
          : `${plan.displayName} renewal #${(user.renewalCount || 0) + 1}`,
        status: 'COMPLETED',
        reference: JSON.stringify({
          planName: plan.name,
          paymentMethod,
          paymentDetails,
          renewalCount: isActualUpgrade ? 0 : (user.renewalCount || 0) + 1,
          basePrice: plan.price,
          renewalPrice: renewalPrice,
          isUpgrade: isActualUpgrade
        })
      }
    });

    // Create notification
    const discountText = renewalPrice < plan.price 
      ? ` with ${Math.round(((plan.price - renewalPrice) / plan.price) * 100)}% loyalty discount!`
      : '!';

    await prisma.notification.create({
      data: {
        title: isActualUpgrade ? 'Membership Upgraded! 🎉' : 'Membership Renewed! 🎉',
        message: isActualUpgrade
          ? `You've upgraded to ${plan.displayName}! Start earning Rs.${plan.dailyTaskEarning} daily!`
          : `Your ${plan.displayName} has been renewed${discountText} Continue earning Rs.${plan.dailyTaskEarning} daily!`,
        type: 'success',
        recipientId: user.id,
        actionUrl: '/dashboard',
        actionText: 'View Dashboard'
      }
    });

    return NextResponse.json({
      success: true,
      membership: {
        plan: plan.name,
        displayName: plan.displayName,
        renewalCount: updatedUser.renewalCount,
        membershipEndDate: updatedUser.membershipEndDate,
        pricePaid: renewalPrice,
        savings: plan.price - renewalPrice,
        isUpgrade: isActualUpgrade
      },
      message: isActualUpgrade 
        ? `Successfully upgraded to ${plan.displayName}!`
        : `${plan.displayName} renewed successfully!`
    });

  } catch (error) {
    console.error('Error renewing membership:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to renew membership' },
      { status: 500 }
    );
  }
}
