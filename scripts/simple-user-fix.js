const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleUserFix() {
  try {
    console.log('🔧 Simple fix for user dashboard...');

    // Update or create user with email user@example.com
    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {
        balance: 610, // 600 commission + 10 base
        totalEarnings: 610,
        referralEarnings: 600,
        availableVoucherPkr: 0,
        membershipStatus: 'ACTIVE',
        membershipPlan: 'STANDARD',
        membershipStartDate: new Date(),
        membershipEndDate: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000)),
        updatedAt: new Date()
      },
      create: {
        name: 'user01',
        email: 'user@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        referralCode: 'MCN123456',
        balance: 610,
        totalEarnings: 610,
        referralEarnings: 600,
        availableVoucherPkr: 0,
        membershipStatus: 'ACTIVE',
        membershipPlan: 'STANDARD',
        isActive: true,
        membershipStartDate: new Date(),
        membershipEndDate: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000))
      }
    });

    // Create referral user
    await prisma.user.upsert({
      where: { email: 'referral@example.com' },
      update: {
        referredBy: user.referralCode,
        membershipStatus: 'ACTIVE',
        membershipPlan: 'STANDARD'
      },
      create: {
        name: 'Referral User',
        email: 'referral@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        referralCode: 'MCN789012',
        referredBy: user.referralCode,
        membershipStatus: 'ACTIVE',
        membershipPlan: 'STANDARD',
        balance: 500,
        totalEarnings: 500,
        isActive: true
      }
    });

    console.log('✅ User data fixed successfully!');
    console.log(`📊 Total Earnings: PKR ${user.balance}`);
    console.log(`📊 Voucher Balance: PKR 0`);
    console.log(`📊 Referral Commission: PKR 600`);
    console.log(`📊 Network: 1 referral`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simpleUserFix();
