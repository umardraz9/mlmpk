import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/user/membership - Get user's current membership details
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
        membershipStartDate: true,
        membershipEndDate: true,
        taskEarnings: true,
        referralEarnings: true,
        dailyTasksCompleted: true,
        lastTaskCompletionDate: true,
        earningsContinueUntil: true,
        minimumWithdrawal: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get membership plan details if user has one
    let planDetails = null;
    if (user.membershipPlan) {
      planDetails = await prisma.membershipPlan.findUnique({
        where: { name: user.membershipPlan },
        include: {
          referralCommissions: {
            orderBy: { level: 'asc' }
          }
        }
      });
    }

    // Calculate earning status
    const now = new Date();
    const canEarnToday = user.membershipStatus === 'ACTIVE' && 
                        (!user.earningsContinueUntil || now <= user.earningsContinueUntil);
    
    const hasCompletedTasksToday = user.lastTaskCompletionDate && 
                                  user.lastTaskCompletionDate.toDateString() === now.toDateString();

    return NextResponse.json({
      success: true,
      membership: {
        ...user,
        planDetails: planDetails ? {
          ...planDetails,
          features: planDetails.features ? JSON.parse(planDetails.features) : []
        } : null,
        canEarnToday,
        hasCompletedTasksToday,
        totalEarnings: user.taskEarnings + user.referralEarnings
      }
    });

  } catch (error) {
    console.error('Error fetching user membership:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch membership details' },
      { status: 500 }
    );
  }
}

// POST /api/user/membership - Purchase/Activate membership plan
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
    const { planName, paymentMethod, paymentDetails } = body;

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

    // Check if user already has active membership
    if (user.membershipStatus === 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'User already has active membership' },
        { status: 400 }
      );
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.maxEarningDays);

    // Update user with new membership
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        membershipPlan: plan.name,
        membershipStatus: 'ACTIVE',
        membershipStartDate: now,
        membershipEndDate: endDate,
        earningsContinueUntil: endDate,
        minimumWithdrawal: plan.minimumWithdrawal,
        availableVoucherPkr: plan.voucherAmount,
        taskEarnings: 0,
        referralEarnings: 0,
        dailyTasksCompleted: 0
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'MEMBERSHIP_PURCHASE',
        amount: -plan.price, // Negative because it's a payment
        description: `${plan.displayName} membership purchase`,
        status: 'COMPLETED',
        metadata: JSON.stringify({
          planName: plan.name,
          paymentMethod,
          paymentDetails
        })
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        title: 'Membership Activated!',
        message: `Your ${plan.displayName} has been activated. Start earning Rs.${plan.dailyTaskEarning} daily!`,
        type: 'success',
        recipientId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      membership: updatedUser,
      message: `${plan.displayName} activated successfully!`
    });

  } catch (error) {
    console.error('Error activating membership:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to activate membership' },
      { status: 500 }
    );
  }
}
