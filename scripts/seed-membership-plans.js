const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMembershipPlans() {
  console.log('🌱 Seeding membership plans...');

  try {
    // Clear existing data
    await prisma.referralCommission.deleteMany({});
    await prisma.membershipPlan.deleteMany({});

    // Create Basic Plan
    const basicPlan = await prisma.membershipPlan.create({
      data: {
        name: 'BASIC',
        displayName: 'Basic Plan',
        price: 1000,
        dailyTaskEarning: 50,
        maxEarningDays: 30,
        extendedEarningDays: 60,
        minimumWithdrawal: 2000,
        voucherAmount: 500,
        description: 'Perfect for beginners - Start your MCNmart journey',
        features: JSON.stringify([
          'Rs.50 daily task earnings',
          'Rs.1,500 guaranteed in 30 days',
          'Rs.3,000 with referral extension (60 days)',
          'Rs.500 product voucher',
          'Rs.2,000 minimum withdrawal',
          'Basic partnership program access'
        ])
      }
    });

    // Create Standard Plan
    const standardPlan = await prisma.membershipPlan.create({
      data: {
        name: 'STANDARD',
        displayName: 'Standard Plan',
        price: 3000,
        dailyTaskEarning: 150,
        maxEarningDays: 30,
        extendedEarningDays: 60,
        minimumWithdrawal: 4000,
        voucherAmount: 1000,
        description: 'Most popular choice - Enhanced earning potential',
        features: JSON.stringify([
          'Rs.150 daily task earnings',
          'Rs.4,500 guaranteed in 30 days',
          'Rs.9,000 with referral extension (60 days)',
          'Rs.1,000 product voucher',
          'Rs.4,000 minimum withdrawal',
          'Enhanced partnership program access',
          'Priority customer support'
        ])
      }
    });

    // Create Premium Plan
    const premiumPlan = await prisma.membershipPlan.create({
      data: {
        name: 'PREMIUM',
        displayName: 'Premium Plan',
        price: 8000,
        dailyTaskEarning: 400,
        maxEarningDays: 30,
        extendedEarningDays: 60,
        minimumWithdrawal: 10000,
        voucherAmount: 1500,
        description: 'Maximum earning potential - For serious entrepreneurs',
        features: JSON.stringify([
          'Rs.400 daily task earnings',
          'Rs.12,000 guaranteed in 30 days',
          'Rs.24,000 with referral extension (60 days)',
          'Rs.1,500 product voucher',
          'Rs.10,000 minimum withdrawal',
          'Premium partnership program access',
          'VIP customer support',
          'Exclusive training materials'
        ])
      }
    });

    console.log('✅ Membership plans created successfully');

    // Create Referral Commission Structure for Basic Plan (Total Rs.350)
    const basicCommissions = [
      { level: 1, amount: 200, description: 'Direct referral commission' },
      { level: 2, amount: 100, description: 'Level 2 referral commission' },
      { level: 3, amount: 30, description: 'Level 3 referral commission' },
      { level: 4, amount: 15, description: 'Level 4 referral commission' },
      { level: 5, amount: 5, description: 'Level 5 referral commission' }
    ];

    for (const commission of basicCommissions) {
      await prisma.referralCommission.create({
        data: {
          membershipPlanId: basicPlan.id,
          level: commission.level,
          amount: commission.amount,
          percentage: (commission.amount / 1000) * 100, // Percentage of plan price
          description: commission.description
        }
      });
    }

    // Create Referral Commission Structure for Standard Plan (Total Rs.900)
    const standardCommissions = [
      { level: 1, amount: 250, description: 'Direct referral commission' },
      { level: 2, amount: 200, description: 'Level 2 referral commission' },
      { level: 3, amount: 170, description: 'Level 3 referral commission' },
      { level: 4, amount: 160, description: 'Level 4 referral commission' },
      { level: 5, amount: 120, description: 'Level 5 referral commission' }
    ];

    for (const commission of standardCommissions) {
      await prisma.referralCommission.create({
        data: {
          membershipPlanId: standardPlan.id,
          level: commission.level,
          amount: commission.amount,
          percentage: (commission.amount / 3000) * 100, // Percentage of plan price
          description: commission.description
        }
      });
    }

    // Create Referral Commission Structure for Premium Plan (Total Rs.2500)
    const premiumCommissions = [
      { level: 1, amount: 700, description: 'Direct referral commission' },
      { level: 2, amount: 600, description: 'Level 2 referral commission' },
      { level: 3, amount: 500, description: 'Level 3 referral commission' },
      { level: 4, amount: 400, description: 'Level 4 referral commission' },
      { level: 5, amount: 300, description: 'Level 5 referral commission' }
    ];

    for (const commission of premiumCommissions) {
      await prisma.referralCommission.create({
        data: {
          membershipPlanId: premiumPlan.id,
          level: commission.level,
          amount: commission.amount,
          percentage: (commission.amount / 8000) * 100, // Percentage of plan price
          description: commission.description
        }
      });
    }

    console.log('✅ Referral commission structures created successfully');

    // Display summary
    console.log('\n📊 MEMBERSHIP PLANS SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🥉 BASIC PLAN (Rs.1,000):');
    console.log('   • Daily Task Earning: Rs.50');
    console.log('   • 30 Days: Rs.1,500 | 60 Days (with referral): Rs.3,000');
    console.log('   • Referral Commissions: Rs.200 + Rs.100 + Rs.30 + Rs.15 + Rs.5 = Rs.350');
    console.log('   • Minimum Withdrawal: Rs.2,000');

    console.log('\n🥈 STANDARD PLAN (Rs.3,000):');
    console.log('   • Daily Task Earning: Rs.150');
    console.log('   • 30 Days: Rs.4,500 | 60 Days (with referral): Rs.9,000');
    console.log('   • Referral Commissions: Rs.250 + Rs.200 + Rs.170 + Rs.160 + Rs.120 = Rs.900');
    console.log('   • Minimum Withdrawal: Rs.4,000');

    console.log('\n🥇 PREMIUM PLAN (Rs.8,000):');
    console.log('   • Daily Task Earning: Rs.400');
    console.log('   • 30 Days: Rs.12,000 | 60 Days (with referral): Rs.24,000');
    console.log('   • Referral Commissions: Rs.700 + Rs.600 + Rs.500 + Rs.400 + Rs.300 = Rs.2,500');
    console.log('   • Minimum Withdrawal: Rs.10,000');

    console.log('\n💡 KEY FEATURES:');
    console.log('   • Task earnings are GUARANTEED (even without referrals)');
    console.log('   • Referral earnings are BONUS income on top of task earnings');
    console.log('   • Earning period extends from 30 to 60 days with referrals');
    console.log('   • All plans include product vouchers (Basic: Rs.500, Standard: Rs.1,000, Premium: Rs.1,500)');
    console.log('   • Legal compliance with Pakistani business regulations');

    console.log('\n✅ All membership plans and commission structures seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding membership plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedMembershipPlans()
    .then(() => {
      console.log('🎉 Membership plan seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedMembershipPlans };
