const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking all users in database...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        balance: true,
        totalEarnings: true,
        referralEarnings: true,
        availableVoucherPkr: true,
        membershipStatus: true,
        membershipPlan: true,
        referredBy: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name || 'No Name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Referral Code: ${user.referralCode}`);
      console.log(`   Balance: PKR ${user.balance || 0}`);
      console.log(`   Total Earnings: PKR ${user.totalEarnings || 0}`);
      console.log(`   Referral Earnings: PKR ${user.referralEarnings || 0}`);
      console.log(`   Voucher Balance: PKR ${user.availableVoucherPkr || 0}`);
      console.log(`   Membership: ${user.membershipStatus} - ${user.membershipPlan}`);
      console.log(`   Referred By: ${user.referredBy || 'None'}`);
      console.log(`   Created: ${user.createdAt}`);
    });

    // Check referral relationships
    console.log('\n🔗 Checking referral relationships...');
    for (const user of users) {
      if (user.referralCode) {
        const referrals = await prisma.user.count({
          where: { referredBy: user.referralCode }
        });
        if (referrals > 0) {
          console.log(`📊 ${user.name} (${user.email}) has ${referrals} referral(s)`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
