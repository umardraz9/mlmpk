const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDemoFunds() {
  console.log('💰 Adding Rs 1000 to demo user account...\n');

  try {
    // Find the demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demouser@example.com' }
    });

    if (!demoUser) {
      console.log('❌ Demo user not found');
      return;
    }

    // Update user balance
    const updatedUser = await prisma.user.update({
      where: { id: demoUser.id },
      data: {
        balance: {
          increment: 1000
        },
        availableVoucherPkr: {
          increment: 1000
        }
      }
    });

    console.log(`✅ Successfully added Rs 1000 to ${demoUser.email}`);
    console.log(`💳 New balance: Rs ${updatedUser.balance}`);
    console.log(`🎫 Available voucher: Rs ${updatedUser.availableVoucherPkr}`);

  } catch (error) {
    console.error('❌ Error adding funds:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addDemoFunds()
  .catch(console.error)
  .finally(() => process.exit(0));
