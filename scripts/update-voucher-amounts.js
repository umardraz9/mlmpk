const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateVoucherAmounts() {
  try {
    console.log('🔧 Updating voucher amounts in database...');

    // Update Basic Plan
    await prisma.membershipPlan.upsert({
      where: { name: 'BASIC' },
      update: { voucherAmount: 500 },
      create: {
        name: 'BASIC',
        displayName: 'Basic Plan',
        price: 1000,
        dailyTaskEarning: 50,
        maxEarningDays: 30,
        extendedEarningDays: 60,
        minimumWithdrawal: 2000,
        voucherAmount: 500,
        isActive: true
      }
    });

    // Update Standard Plan
    await prisma.membershipPlan.upsert({
      where: { name: 'STANDARD' },
      update: { voucherAmount: 1000 },
      create: {
        name: 'STANDARD',
        displayName: 'Standard Plan',
        price: 3000,
        dailyTaskEarning: 150,
        maxEarningDays: 30,
        extendedEarningDays: 60,
        minimumWithdrawal: 4000,
        voucherAmount: 1000,
        isActive: true
      }
    });

    // Update Premium Plan
    await prisma.membershipPlan.upsert({
      where: { name: 'PREMIUM' },
      update: { voucherAmount: 2000 },
      create: {
        name: 'PREMIUM',
        displayName: 'Premium Plan',
        price: 8000,
        dailyTaskEarning: 400,
        maxEarningDays: 30,
        extendedEarningDays: 60,
        minimumWithdrawal: 10000,
        voucherAmount: 2000,
        isActive: true
      }
    });

    // Update existing users' voucher balances based on their plan
    const users = await prisma.user.findMany({
      where: { membershipPlan: { not: null } }
    });

    for (const user of users) {
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
      }
      
      if (voucherAmount > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { availableVoucherPkr: voucherAmount }
        });
      }
    }

    console.log('✅ Voucher amounts updated successfully!');
    console.log('📊 Basic Plan: PKR 500 voucher');
    console.log('📊 Standard Plan: PKR 1,000 voucher');
    console.log('📊 Premium Plan: PKR 2,000 voucher');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateVoucherAmounts();
