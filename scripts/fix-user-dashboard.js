const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserDashboard() {
  try {
    console.log('🔧 Fixing user dashboard issues...');

    // Find user by email user@example.com
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'user@example.com' },
          { email: { contains: 'user' } }
        ]
      }
    });

    if (!user) {
      // Create the user if not exists
      console.log('👤 Creating user account...');
      user = await prisma.user.create({
        data: {
          name: 'user01',
          email: 'user@example.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // hashed "12345678"
          referralCode: 'MCN' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          membershipStatus: 'ACTIVE',
          membershipPlan: 'STANDARD',
          balance: 10,
          totalEarnings: 10,
          referralEarnings: 0,
          availableVoucherPkr: 0,
          isActive: true,
          membershipStartDate: new Date(),
          membershipEndDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)),
          earningsContinueUntil: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
        }
      });
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    console.log(`📊 Working with user: ${user.name} (${user.email})`);

    // Create a referral user if not exists
    let referralUser = await prisma.user.findFirst({
      where: { referredBy: user.referralCode }
    });

    if (!referralUser) {
      console.log('👥 Creating referral user...');
      referralUser = await prisma.user.create({
        data: {
          name: 'Referral User',
          email: 'referral@example.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          referralCode: 'MCN' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          referredBy: user.referralCode,
          membershipStatus: 'ACTIVE',
          membershipPlan: 'STANDARD',
          balance: 500,
          totalEarnings: 500,
          isActive: true,
          membershipStartDate: new Date(),
          membershipEndDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000))
        }
      });
      console.log(`✅ Created referral: ${referralUser.name} (${referralUser.email})`);
    }

    // Calculate proper referral commission (20% of Standard plan = 600 PKR)
    const standardPlanPrice = 3000;
    const level1Commission = standardPlanPrice * 0.20; // 600 PKR

    // Update main user with proper earnings and commission
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: level1Commission + 10, // Commission + base earnings
        totalEarnings: level1Commission + 10,
        referralEarnings: level1Commission,
        availableVoucherPkr: 0, // Keep voucher at 0 as requested
        membershipStartDate: new Date(),
        membershipEndDate: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000)), // 45 days
        earningsContinueUntil: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000)),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated user balance: PKR ${updatedUser.balance}`);
    console.log(`✅ Updated referral earnings: PKR ${updatedUser.referralEarnings}`);

    // Create transaction record for referral commission
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'REFERRAL_COMMISSION',
        amount: level1Commission,
        status: 'COMPLETED',
        description: 'Level 1 referral commission from active referral',
        createdAt: new Date()
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Referral Commission Credited!',
        message: `Congratulations! You've earned PKR ${level1Commission} from your referral. Your total earnings are now PKR ${updatedUser.balance}.`,
        type: 'money',
        isRead: false,
        createdAt: new Date()
      }
    });

    // Verify referral count
    const referralCount = await prisma.user.count({
      where: { referredBy: user.referralCode }
    });

    console.log(`📊 Final Status:`);
    console.log(`   Total Earnings: PKR ${updatedUser.balance}`);
    console.log(`   Voucher Balance: PKR ${updatedUser.availableVoucherPkr}`);
    console.log(`   Total Network: ${referralCount}`);
    console.log(`   Direct Referrals: ${referralCount}`);
    console.log(`   Referral Commission: PKR ${updatedUser.referralEarnings}`);
    console.log(`   Membership: ${updatedUser.membershipStatus} - ${updatedUser.membershipPlan}`);
    console.log(`   Start Date: ${updatedUser.membershipStartDate}`);
    console.log(`   End Date: ${updatedUser.membershipEndDate}`);

    console.log('🎉 Dashboard fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing dashboard:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserDashboard();
