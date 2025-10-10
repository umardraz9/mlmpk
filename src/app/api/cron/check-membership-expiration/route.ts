import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This endpoint should be called by a cron job daily
// Example: Vercel Cron, GitHub Actions, or external cron service
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    
    // Find all users with active memberships that have expired
    const expiredUsers = await prisma.user.findMany({
      where: {
        membershipStatus: 'ACTIVE',
        membershipEndDate: {
          lt: now
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        membershipPlan: true,
        membershipEndDate: true,
        renewalCount: true
      }
    });

    console.log(`Found ${expiredUsers.length} expired memberships`);

    // Update expired memberships
    const updatePromises = expiredUsers.map(async (user) => {
      // Update status to EXPIRED
      await prisma.user.update({
        where: { id: user.id },
        data: {
          membershipStatus: 'EXPIRED',
          tasksEnabled: false // Disable tasks for expired users
        }
      });

      // Create expiration notification
      await prisma.notification.create({
        data: {
          title: 'Membership Expired',
          message: `Your ${user.membershipPlan} membership has expired. Renew now to continue earning!`,
          type: 'warning',
          priority: 'high',
          recipientId: user.id,
          actionUrl: '/membership/renew',
          actionText: 'Renew Now'
        }
      });

      return user;
    });

    await Promise.all(updatePromises);

    // Find users with memberships expiring in 7 days (warning notification)
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringUsers = await prisma.user.findMany({
      where: {
        membershipStatus: 'ACTIVE',
        membershipEndDate: {
          gte: now,
          lte: sevenDaysFromNow
        },
        expirationNotified: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        membershipPlan: true,
        membershipEndDate: true,
        renewalCount: true
      }
    });

    console.log(`Found ${expiringUsers.length} memberships expiring within 7 days`);

    // Send 7-day warning notifications
    const warningPromises = expiringUsers.map(async (user) => {
      const daysRemaining = Math.ceil((user.membershipEndDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Get renewal price for this user
      const plan = await prisma.membershipPlan.findUnique({
        where: { name: user.membershipPlan! }
      });

      let renewalPrice = plan?.price || 0;
      if (user.renewalCount === 0) {
        renewalPrice = plan?.price || 0;
      } else if (user.renewalCount === 1) {
        renewalPrice = Math.round((plan?.price || 0) * 0.9);
      } else {
        renewalPrice = Math.round((plan?.price || 0) * 0.8);
      }

      const discountText = renewalPrice < (plan?.price || 0)
        ? ` Get ${Math.round(((plan!.price - renewalPrice) / plan!.price) * 100)}% loyalty discount!`
        : '';

      await prisma.notification.create({
        data: {
          title: '⚠️ Membership Expiring Soon',
          message: `Your ${user.membershipPlan} membership expires in ${daysRemaining} days. Renew for Rs.${renewalPrice}${discountText}`,
          type: 'warning',
          priority: 'high',
          recipientId: user.id,
          actionUrl: '/membership/renew',
          actionText: 'Renew Now'
        }
      });

      // Mark as notified
      await prisma.user.update({
        where: { id: user.id },
        data: { expirationNotified: true }
      });

      return user;
    });

    await Promise.all(warningPromises);

    // Find users with memberships expiring in 3 days (urgent notification)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const urgentExpiringUsers = await prisma.user.findMany({
      where: {
        membershipStatus: 'ACTIVE',
        membershipEndDate: {
          gte: now,
          lte: threeDaysFromNow
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        membershipPlan: true,
        membershipEndDate: true
      }
    });

    console.log(`Found ${urgentExpiringUsers.length} memberships expiring within 3 days`);

    // Send 3-day urgent notifications
    const urgentPromises = urgentExpiringUsers.map(async (user) => {
      const daysRemaining = Math.ceil((user.membershipEndDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      await prisma.notification.create({
        data: {
          title: '🚨 Last Chance to Renew!',
          message: `Your ${user.membershipPlan} membership expires in ${daysRemaining} days! Don't lose your earning streak!`,
          type: 'error',
          priority: 'urgent',
          recipientId: user.id,
          actionUrl: '/membership/renew',
          actionText: 'Renew Immediately'
        }
      });

      return user;
    });

    await Promise.all(urgentPromises);

    return NextResponse.json({
      success: true,
      summary: {
        expiredCount: expiredUsers.length,
        expiring7DaysCount: expiringUsers.length,
        expiring3DaysCount: urgentExpiringUsers.length,
        timestamp: now.toISOString()
      },
      expiredUsers: expiredUsers.map(u => ({
        id: u.id,
        email: u.email,
        plan: u.membershipPlan,
        expiredOn: u.membershipEndDate
      }))
    });

  } catch (error) {
    console.error('Error checking membership expiration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check membership expiration' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
