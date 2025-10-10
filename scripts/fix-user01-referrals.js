const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUser01Referrals() {
  try {
    console.log('🔧 Fixing user01 referral commissions and dashboard data...');

    // Find user01 by email
    const user01 = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
      include: {
        referrals: true
      }
    });

    if (!user01) {
      console.log('❌ User01 not found');
      return;
    }

    console.log(`📊 Found user: ${user01.name} (${user01.email})`);
    console.log(`📊 Current balance: PKR ${user01.balance || 0}`);
    console.log(`📊 Current referrals: ${user01.referrals?.length || 0}`);

    // Check if user has referrals
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: user01.referralCode },
      select: {
        id: true,
        name: true,
        email: true,
        membershipStatus: true,
        membershipPlan: true,
        createdAt: true
      }
    });

    console.log(`📊 Direct referrals found: ${directReferrals.length}`);
    
    if (directReferrals.length > 0) {
      console.log('📊 Referral details:');
      directReferrals.forEach((ref, index) => {
        console.log(`  ${index + 1}. ${ref.name} (${ref.email}) - ${ref.membershipStatus} - ${ref.membershipPlan}`);
      });

      // Calculate Level 1 commission (20% of referral's plan cost)
      let level1Commission = 0;
      for (const referral of directReferrals) {
        if (referral.membershipStatus === 'ACTIVE') {
          // Standard plan costs PKR 3000, so 20% = PKR 600
          const planCommission = referral.membershipPlan === 'STANDARD' ? 600 : 200; // Basic = 200, Standard = 600
          level1Commission += planCommission;
        }
      }

      console.log(`💰 Calculated Level 1 commission: PKR ${level1Commission}`);

      // Update user's balance and referral earnings
      const updatedUser = await prisma.user.update({
        where: { id: user01.id },
        data: {
          balance: Math.max(user01.balance || 0, level1Commission + 10), // Ensure at least commission + base earnings
          referralEarnings: level1Commission,
          totalEarnings: Math.max(user01.totalEarnings || 0, level1Commission + 10),
          availableVoucherPkr: user01.availableVoucherPkr || 0, // Keep existing voucher balance
          updatedAt: new Date()
        }
      });

      console.log(`✅ Updated user balance to: PKR ${updatedUser.balance}`);
      console.log(`✅ Updated referral earnings to: PKR ${updatedUser.referralEarnings}`);

      // Create a commission transaction record
      await prisma.transaction.create({
        data: {
          userId: user01.id,
          type: 'REFERRAL_COMMISSION',
          amount: level1Commission,
          status: 'COMPLETED',
          description: `Level 1 referral commission from ${directReferrals.length} active referral(s)`,
          createdAt: new Date()
        }
      });

      console.log(`✅ Created commission transaction record`);

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: user01.id,
          title: 'Referral Commission Credited',
          message: `Congratulations! You've earned PKR ${level1Commission} in referral commissions from your ${directReferrals.length} active referral(s).`,
          type: 'money',
          isRead: false,
          createdAt: new Date()
        }
      });

      console.log(`✅ Created notification for commission credit`);

    } else {
      console.log('⚠️ No active referrals found for commission calculation');
    }

    // Update membership dates to show proper timeline
    if (user01.membershipStatus === 'ACTIVE' && !user01.membershipStartDate) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days from now

      await prisma.user.update({
        where: { id: user01.id },
        data: {
          membershipStartDate: startDate,
          membershipEndDate: endDate,
          earningsContinueUntil: endDate
        }
      });

      console.log(`✅ Updated membership dates: ${startDate.toDateString()} to ${endDate.toDateString()}`);
    }

    console.log('🎉 User01 referral fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing user01 referrals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixUser01Referrals();
