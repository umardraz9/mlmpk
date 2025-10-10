const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserVoucher() {
  try {
    console.log('🔍 Checking user voucher balance...');

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
      select: { 
        id: true, 
        email: true,
        membershipPlan: true, 
        membershipStatus: true,
        availableVoucherPkr: true,
        balance: true
      }
    });

    if (user) {
      console.log('📊 Current User Data:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Membership Plan: ${user.membershipPlan}`);
      console.log(`   Membership Status: ${user.membershipStatus}`);
      console.log(`   Voucher Balance: PKR ${user.availableVoucherPkr}`);
      console.log(`   Cash Balance: PKR ${user.balance}`);

      // Force update voucher balance based on plan
      let correctVoucherAmount = 0;
      switch (user.membershipPlan) {
        case 'BASIC':
          correctVoucherAmount = 500;
          break;
        case 'STANDARD':
          correctVoucherAmount = 1000;
          break;
        case 'PREMIUM':
          correctVoucherAmount = 2000;
          break;
      }

      if (user.availableVoucherPkr !== correctVoucherAmount) {
        console.log(`🔧 Updating voucher balance from ${user.availableVoucherPkr} to ${correctVoucherAmount}`);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { availableVoucherPkr: correctVoucherAmount }
        });

        console.log('✅ Voucher balance updated successfully!');
      } else {
        console.log('✅ Voucher balance is already correct!');
      }

      // Get plan details
      const plan = await prisma.membershipPlan.findUnique({
        where: { name: user.membershipPlan || 'STANDARD' },
        select: { voucherAmount: true }
      });

      if (plan) {
        console.log(`📋 Plan voucher amount: PKR ${plan.voucherAmount}`);
      }

    } else {
      console.log('❌ User not found: user@example.com');
      
      // Create the user if not exists
      await prisma.user.create({
        data: {
          name: 'user01',
          email: 'user@example.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          referralCode: 'MCN123456',
          balance: 610,
          totalEarnings: 610,
          referralEarnings: 600,
          availableVoucherPkr: 1000,
          membershipStatus: 'ACTIVE',
          membershipPlan: 'STANDARD',
          isActive: true,
          membershipStartDate: new Date(),
          membershipEndDate: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000))
        }
      });
      console.log('✅ Created user with PKR 1000 voucher balance');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserVoucher();
