const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserVoucherBalance() {
  try {
    console.log('🔧 Fixing user voucher balance...');

    // Update the user@example.com account with proper voucher balance
    const user = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
      select: { id: true, membershipPlan: true, availableVoucherPkr: true }
    });

    if (user) {
      let voucherAmount = 0;
      switch (user.membershipPlan) {
        case 'BASIC':
          voucherAmount = 500;
          break;
        case 'STANDARD':
          voucherAmount = 1000;
          break;
        case 'PREMIUM':
          voucherAmount = 2000;
          break;
        default:
          voucherAmount = 1000; // Default to Standard
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          availableVoucherPkr: voucherAmount,
          membershipPlan: 'STANDARD' // Ensure Standard plan
        }
      });

      console.log(`✅ Updated user voucher balance to PKR ${voucherAmount}`);
      console.log(`📊 Plan: ${user.membershipPlan || 'STANDARD'}`);
      console.log(`📊 Previous voucher balance: PKR ${user.availableVoucherPkr || 0}`);
      console.log(`📊 New voucher balance: PKR ${voucherAmount}`);
    } else {
      console.log('❌ User not found: user@example.com');
    }

    // Also update any other active users with zero voucher balance
    const usersWithZeroVouchers = await prisma.user.findMany({
      where: {
        availableVoucherPkr: 0,
        membershipStatus: 'ACTIVE',
        membershipPlan: { not: null }
      }
    });

    for (const u of usersWithZeroVouchers) {
      let voucherAmount = 0;
      switch (u.membershipPlan) {
        case 'BASIC':
          voucherAmount = 500;
          break;
        case 'STANDARD':
          voucherAmount = 1000;
          break;
        case 'PREMIUM':
          voucherAmount = 2000;
          break;
      }
      
      if (voucherAmount > 0) {
        await prisma.user.update({
          where: { id: u.id },
          data: { availableVoucherPkr: voucherAmount }
        });
        console.log(`✅ Updated user ${u.email} voucher balance to PKR ${voucherAmount}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserVoucherBalance();
