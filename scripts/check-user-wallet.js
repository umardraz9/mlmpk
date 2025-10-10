const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserWallet() {
  console.log('💳 Checking user wallet details...\n');

  try {
    // Find the demo user with full details
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demouser@example.com' },
      include: {
        taskCompletions: {
          include: {
            task: true
          }
        }
      }
    });

    if (!demoUser) {
      console.log('❌ Demo user not found');
      return;
    }

    console.log('👤 User Wallet Details:');
    console.log(`📧 Email: ${demoUser.email}`);
    console.log(`💰 Balance: Rs ${demoUser.balance}`);
    console.log(`🎫 Available Voucher: Rs ${demoUser.availableVoucherPkr}`);
    console.log(`💵 Total Earnings: Rs ${demoUser.totalEarnings}`);
    console.log(`🏆 Total Points: ${demoUser.totalPoints}`);
    console.log(`✅ Tasks Completed: ${demoUser.tasksCompleted}`);

    // Show completed tasks
    if (demoUser.taskCompletions.length > 0) {
      console.log('\n📋 Completed Tasks:');
      demoUser.taskCompletions.forEach((completion, index) => {
        console.log(`   ${index + 1}. ${completion.task.title} - ${completion.task.reward} points`);
      });
    } else {
      console.log('\n📋 No tasks completed yet');
    }

  } catch (error) {
    console.error('❌ Error checking wallet:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkUserWallet()
  .catch(console.error)
  .finally(() => process.exit(0));
