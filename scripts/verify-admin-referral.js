const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAdminReferral() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@mcnmart.com' },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        isAdmin: true
      }
    });

    if (admin) {
      console.log('✅ Admin User Found:');
      console.log('   Email:', admin.email);
      console.log('   Name:', admin.name);
      console.log('   Referral Code:', admin.referralCode);
      console.log('   Is Admin:', admin.isAdmin);
    } else {
      console.log('❌ Admin user not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminReferral();
