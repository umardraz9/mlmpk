import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/session';

const prisma = new PrismaClient();

// POST /api/tasks/daily-earning - Process daily task earning
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
    const { taskId, completionData } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has active membership
    if (user.membershipStatus !== 'ACTIVE' || !user.membershipPlan) {
      return NextResponse.json(
        { success: false, error: 'No active membership plan' },
        { status: 400 }
      );
    }

    // Get membership plan details
    const plan = await prisma.membershipPlan.findUnique({
      where: { name: user.membershipPlan }
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid membership plan' },
        { status: 400 }
      );
    }

    // Check if user can still earn (within earning period)
    const now = new Date();
    if (user.earningsContinueUntil && now > user.earningsContinueUntil) {
      return NextResponse.json(
        { success: false, error: 'Earning period has expired' },
        { status: 400 }
      );
    }

    // Check if user has already completed tasks today
    const today = new Date().toDateString();
    const lastCompletion = user.lastTaskCompletionDate?.toDateString();
    
    if (lastCompletion === today) {
      return NextResponse.json(
        { success: false, error: 'Daily tasks already completed for today' },
        { status: 400 }
      );
    }

    // Process the task completion and award daily earning
    const dailyEarning = plan.dailyTaskEarning;
    
    // Update user earnings and task completion
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        taskEarnings: user.taskEarnings + dailyEarning,
        totalEarnings: user.totalEarnings + dailyEarning,
        balance: user.balance + dailyEarning,
        dailyTasksCompleted: user.dailyTasksCompleted + 1,
        lastTaskCompletionDate: now,
        tasksCompleted: user.tasksCompleted + 1
      }
    });

    // Create task earning history record
    await prisma.taskEarningHistory.create({
      data: {
        userId: user.id,
        membershipPlan: user.membershipPlan,
        dailyEarning: dailyEarning,
        tasksCompleted: 1,
        earningDate: now,
        isExtendedPeriod: user.earningsContinueUntil ? now > user.membershipEndDate! : false
      }
    });

    // Create task completion record if taskId provided
    if (taskId) {
      await prisma.taskCompletion.create({
        data: {
          userId: user.id,
          taskId: taskId,
          status: 'COMPLETED',
          progress: 100,
          reward: dailyEarning,
          trackingData: completionData ? JSON.stringify(completionData) : null,
          completedAt: now
        }
      });
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'TASK_EARNING',
        amount: dailyEarning,
        description: `Daily task earning - ${plan.displayName}`,
        status: 'COMPLETED'
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        title: 'Daily Earning Completed!',
        message: `You earned Rs.${dailyEarning} from your ${plan.displayName}. Total earnings: Rs.${updatedUser.taskEarnings}`,
        type: 'success',
        recipientId: user.id
      }
    });

    // Calculate remaining earning days
    const remainingDays = user.earningsContinueUntil ? 
      Math.ceil((user.earningsContinueUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return NextResponse.json({
      success: true,
      earning: {
        dailyAmount: dailyEarning,
        totalTaskEarnings: updatedUser.taskEarnings,
        totalEarnings: updatedUser.totalEarnings,
        remainingDays: remainingDays,
        canEarnTomorrow: remainingDays > 0
      },
      message: `Congratulations! You earned Rs.${dailyEarning} today!`
    });

  } catch (error) {
    console.error('Error processing daily earning:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process daily earning' },
      { status: 500 }
    );
  }
}

// GET /api/tasks/daily-earning - Get daily earning status
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get membership plan details
    let plan = null;
    if (user.membershipPlan) {
      plan = await prisma.membershipPlan.findUnique({
        where: { name: user.membershipPlan }
      });
    }

    // Check earning status
    const now = new Date();
    const today = new Date().toDateString();
    const lastCompletion = user.lastTaskCompletionDate?.toDateString();
    
    const canEarnToday = user.membershipStatus === 'ACTIVE' && 
                        user.earningsContinueUntil && 
                        now <= user.earningsContinueUntil &&
                        lastCompletion !== today;

    const remainingDays = user.earningsContinueUntil ? 
      Math.max(0, Math.ceil((user.earningsContinueUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    return NextResponse.json({
      success: true,
      status: {
        canEarnToday,
        hasCompletedToday: lastCompletion === today,
        dailyEarningAmount: plan?.dailyTaskEarning || 0,
        totalTaskEarnings: user.taskEarnings,
        totalReferralEarnings: user.referralEarnings,
        remainingDays,
        membershipPlan: user.membershipPlan,
        membershipStatus: user.membershipStatus
      }
    });

  } catch (error) {
    console.error('Error fetching daily earning status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch earning status' },
      { status: 500 }
    );
  }
}
