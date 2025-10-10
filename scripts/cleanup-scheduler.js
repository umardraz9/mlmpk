// Auto-cleanup scheduler for MCNmart messaging system
// This script should be run daily via cron job to delete messages older than 30 days

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOldMessages() {
  try {
    console.log('🧹 Starting auto-cleanup process...');
    
    // Calculate 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    console.log(`📅 Deleting messages older than: ${thirtyDaysAgo.toISOString()}`);

    // Delete old direct messages
    const deletedMessages = await prisma.directMessage.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    // Delete old message notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        type: 'message',
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    console.log('✅ Auto-cleanup completed successfully:');
    console.log(`   📨 Deleted messages: ${deletedMessages.count}`);
    console.log(`   🔔 Deleted notifications: ${deletedNotifications.count}`);
    console.log(`   📅 Cutoff date: ${thirtyDaysAgo.toISOString()}`);

    // Log cleanup activity
    await prisma.systemLog.create({
      data: {
        action: 'AUTO_CLEANUP',
        details: JSON.stringify({
          deletedMessages: deletedMessages.count,
          deletedNotifications: deletedNotifications.count,
          cutoffDate: thirtyDaysAgo.toISOString(),
          executedAt: new Date().toISOString()
        }),
        createdAt: new Date()
      }
    }).catch(() => {
      // Ignore if systemLog table doesn't exist
      console.log('📝 System log table not available, skipping log entry');
    });

    return {
      success: true,
      deletedMessages: deletedMessages.count,
      deletedNotifications: deletedNotifications.count,
      cutoffDate: thirtyDaysAgo.toISOString()
    };

  } catch (error) {
    console.error('❌ Auto-cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if script is executed directly
if (require.main === module) {
  cleanupOldMessages()
    .then((result) => {
      console.log('🎉 Cleanup completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupOldMessages };
