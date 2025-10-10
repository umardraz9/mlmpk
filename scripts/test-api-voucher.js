const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiVoucher() {
  try {
    console.log('🔍 Testing API voucher response...');

    // First check what's actually in the database
    const user = await prisma.user.findUnique({
      where: { email: 'user@example.com' },
      select: {
        id: true,
        email: true,
        availableVoucherPkr: true,
        membershipPlan: true,
        membershipStatus: true,
      }
    });

    console.log('📊 Database User Data:');
    console.log(`   Email: ${user?.email}`);
    console.log(`   Voucher Balance: PKR ${user?.availableVoucherPkr}`);
    console.log(`   Membership Plan: ${user?.membershipPlan}`);
    console.log(`   Membership Status: ${user?.membershipStatus}`);

    // Check plan data
    const plan = await prisma.membershipPlan.findUnique({
      where: { name: 'STANDARD' },
      select: { voucherAmount: true }
    });

    console.log(`📋 Plan Data:`);
    console.log(`   Standard Plan Voucher Amount: PKR ${plan?.voucherAmount}`);

    // Force update user voucher to match plan
    if (user && plan && user.availableVoucherPkr !== plan.voucherAmount) {
      console.log('🔧 Forcing voucher balance update...');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          availableVoucherPkr: plan.voucherAmount,
          membershipPlan: 'STANDARD',
          membershipStatus: 'ACTIVE'
        }
      });

      console.log(`✅ Updated user voucher balance to PKR ${plan.voucherAmount}`);
    }

    // Test API request simulation
    console.log('\n🌐 Testing API logic...');
    
    const voucherBalance = user?.availableVoucherPkr || 0;
    const fallbackVoucher = (voucherBalance === 0 && user?.membershipStatus === 'ACTIVE' && plan) 
      ? plan.voucherAmount || 0 
      : voucherBalance;

    console.log(`   User DB Voucher: PKR ${voucherBalance}`);
    console.log(`   Plan Voucher: PKR ${plan?.voucherAmount}`);
    console.log(`   Final API Response: PKR ${fallbackVoucher}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApiVoucher();
