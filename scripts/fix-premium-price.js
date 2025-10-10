// Fix/Upsert Premium membership plan price to Rs. 8,000
// Usage: node scripts/fix-premium-price.js

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    const PREMIUM_NAME = 'PREMIUM';
    const TARGET_PRICE = 8000;

    // SQLite comparisons can be case-sensitive; ensure we handle any casing
    const allPlans = await prisma.membershipPlan.findMany();
    const existing = allPlans.find(p => (p.name || '').toUpperCase() === PREMIUM_NAME);

    if (existing) {
      const updated = await prisma.membershipPlan.update({
        where: { id: existing.id },
        data: {
          price: TARGET_PRICE,
          isActive: true,
        },
      });
      console.log('✅ Updated Premium plan');
      console.log('   ID:', updated.id);
      console.log('   Old price:', existing.price);
      console.log('   New price:', updated.price);
      console.log('   isActive:', updated.isActive);
    } else {
      // Create Premium if it does not exist
      const created = await prisma.membershipPlan.create({
        data: {
          name: PREMIUM_NAME,
          displayName: 'Premium Plan',
          price: TARGET_PRICE,
          dailyTaskEarning: 400,
          maxEarningDays: 30,
          extendedEarningDays: 60,
          minimumWithdrawal: 10000,
          voucherAmount: 500,
          description: 'Highest earnings and best benefits.',
          isActive: true,
        },
      });
      console.log('✅ Created Premium plan');
      console.log('   ID:', created.id);
      console.log('   Price:', created.price);
    }

    // Print a quick summary of plans
    const plans = await prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: { id: true, name: true, displayName: true, price: true },
    });
    console.log('\nActive plans:');
    for (const p of plans) {
      console.log(` - ${p.name} (${p.displayName}): Rs.${p.price}`);
    }
  } catch (err) {
    console.error('❌ Failed to update Premium plan:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
