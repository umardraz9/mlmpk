const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function applyPerformanceIndexes() {
  console.log('🚀 Applying performance optimization indexes...\n');
  
  const indexQueries = [
    // User table indexes
    { name: 'idx_user_email', query: `CREATE INDEX IF NOT EXISTS idx_user_email ON User(email)` },
    { name: 'idx_user_referralCode', query: `CREATE INDEX IF NOT EXISTS idx_user_referralCode ON User(referralCode)` },
    { name: 'idx_user_sponsorId', query: `CREATE INDEX IF NOT EXISTS idx_user_sponsorId ON User(sponsorId)` },
    { name: 'idx_user_membershipStatus', query: `CREATE INDEX IF NOT EXISTS idx_user_membershipStatus ON User(membershipStatus)` },
    { name: 'idx_user_createdAt', query: `CREATE INDEX IF NOT EXISTS idx_user_createdAt ON User(createdAt DESC)` },
    { name: 'idx_user_isAdmin', query: `CREATE INDEX IF NOT EXISTS idx_user_isAdmin ON User(isAdmin)` },
    { name: 'idx_user_isActive', query: `CREATE INDEX IF NOT EXISTS idx_user_isActive ON User(isActive)` },
    { name: 'idx_user_status_plan', query: `CREATE INDEX IF NOT EXISTS idx_user_status_plan ON User(membershipStatus, membershipPlan)` },
    
    // Order table indexes
    { name: 'idx_order_userId', query: `CREATE INDEX IF NOT EXISTS idx_order_userId ON "Order"(userId)` },
    { name: 'idx_order_orderNumber', query: `CREATE INDEX IF NOT EXISTS idx_order_orderNumber ON "Order"(orderNumber)` },
    { name: 'idx_order_status', query: `CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status)` },
    { name: 'idx_order_paymentStatus', query: `CREATE INDEX IF NOT EXISTS idx_order_paymentStatus ON "Order"(paymentStatus)` },
    { name: 'idx_order_createdAt', query: `CREATE INDEX IF NOT EXISTS idx_order_createdAt ON "Order"(createdAt DESC)` },
    
    // TaskCompletion indexes
    { name: 'idx_taskcompletion_userId', query: `CREATE INDEX IF NOT EXISTS idx_taskcompletion_userId ON TaskCompletion(userId)` },
    { name: 'idx_taskcompletion_taskId', query: `CREATE INDEX IF NOT EXISTS idx_taskcompletion_taskId ON TaskCompletion(taskId)` },
    { name: 'idx_taskcompletion_completedAt', query: `CREATE INDEX IF NOT EXISTS idx_taskcompletion_completedAt ON TaskCompletion(completedAt DESC)` },
    
    // Notification indexes
    { name: 'idx_notification_userId', query: `CREATE INDEX IF NOT EXISTS idx_notification_userId ON Notification(userId)` },
    { name: 'idx_notification_read', query: `CREATE INDEX IF NOT EXISTS idx_notification_read ON Notification(read)` },
    { name: 'idx_notification_createdAt', query: `CREATE INDEX IF NOT EXISTS idx_notification_createdAt ON Notification(createdAt DESC)` },
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const index of indexQueries) {
    try {
      await prisma.$executeRawUnsafe(index.query);
      console.log(`✅ Applied index: ${index.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to apply index ${index.name}:`, error.message);
      errorCount++;
    }
  }
  
  // Run ANALYZE to update query optimizer statistics
  try {
    await prisma.$executeRawUnsafe('ANALYZE');
    console.log('\n✅ Database statistics updated (ANALYZE)');
  } catch (error) {
    console.error('❌ Failed to run ANALYZE:', error.message);
  }
  
  // Set SQLite optimizations
  const pragmas = [
    'PRAGMA journal_mode = WAL',
    'PRAGMA synchronous = NORMAL',
    'PRAGMA cache_size = 10000',
    'PRAGMA temp_store = MEMORY',
    'PRAGMA mmap_size = 30000000000',
  ];
  
  console.log('\n🔧 Applying SQLite optimizations...');
  for (const pragma of pragmas) {
    try {
      await prisma.$executeRawUnsafe(pragma);
      console.log(`✅ ${pragma}`);
    } catch (error) {
      console.error(`❌ Failed to set pragma:`, error.message);
    }
  }
  
  console.log(`
========================================
📊 Index Application Summary:
   ✅ Successful: ${successCount}
   ❌ Failed: ${errorCount}
   📈 Total indexes: ${indexQueries.length}
========================================
  `);
  
  await prisma.$disconnect();
}

// Run the script
applyPerformanceIndexes()
  .catch(async (error) => {
    console.error('Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
