const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReferralSystem() {
  try {
    console.log('🧪 Testing Referral System\n');
    
    // 1. Check admin referral code
    console.log('1️⃣ Checking Admin Referral Code...');
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@mcnmart.com' },
      select: { id: true, name: true, email: true, referralCode: true, isAdmin: true }
    });
    
    if (admin && admin.referralCode === 'admin123') {
      console.log('   ✅ Admin referral code is correctly set to "admin123"');
      console.log(`   Admin: ${admin.name} (${admin.email})\n`);
    } else if (admin) {
      console.log(`   ⚠️  Admin referral code is "${admin.referralCode}" (expected "admin123")\n`);
    } else {
      console.log('   ❌ Admin user not found\n');
      return;
    }
    
    // 2. Check users referred by admin
    console.log('2️⃣ Checking Users Referred by Admin...');
    const referredUsers = await prisma.user.findMany({
      where: { referredBy: 'admin123' },
      select: { id: true, name: true, email: true, referredBy: true, createdAt: true }
    });
    
    if (referredUsers.length > 0) {
      console.log(`   ✅ Found ${referredUsers.length} user(s) referred by admin:`);
      referredUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - Joined: ${user.createdAt.toLocaleDateString()}`);
      });
    } else {
      console.log('   ℹ️  No users have been referred by admin yet');
    }
    console.log();
    
    // 3. Summary
    console.log('📊 Summary:');
    console.log(`   • Admin Referral Code: ${admin.referralCode}`);
    console.log(`   • Total Referrals: ${referredUsers.length}`);
    console.log(`   • System Status: ${admin.referralCode === 'admin123' ? '✅ Ready' : '⚠️  Needs Update'}`);
    console.log();
    console.log('💡 How it works:');
    console.log('   • Users who enter a referral code will be linked to that referrer');
    console.log('   • Users who DON\'T enter a referral code will automatically be linked to admin (admin123)');
    console.log('   • This ensures all users have a referrer for the MLM structure');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReferralSystem();
