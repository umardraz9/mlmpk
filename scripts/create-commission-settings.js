const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCommissionSettings() {
  try {
    console.log('🔧 Creating MCNmart Partnership Program Settings...');
    
    // Delete any existing commission settings to avoid duplicates
    await prisma.commissionSettings.deleteMany({});
    console.log('✅ Cleared existing commission settings');
    
    // Create the 5-level partnership program settings with government-compliant terminology
    const commissionSettings = [
      {
        level: 1,
        name: 'MCNmart Level 1 - Direct Partnership',
        description: 'Income from your direct partners',
        rate: 15.0, // 15% of sales
        isActive: true
      },
      {
        level: 2,
        name: 'MCNmart Level 2 - Extended Partnership',
        description: 'Income from your partners\' network',
        rate: 10.0, // 10% of sales
        isActive: true
      },
      {
        level: 3,
        name: 'MCNmart Level 3 - Network Partnership',
        description: 'Income from your extended network',
        rate: 5.0, // 5% of sales
        isActive: true
      },
      {
        level: 4,
        name: 'MCNmart Level 4 - Community Partnership',
        description: 'Income from your community network',
        rate: 3.0, // 3% of sales
        isActive: true
      },
      {
        level: 5,
        name: 'MCNmart Level 5 - Team Partnership',
        description: 'Income from your team\'s extended network',
        rate: 2.0, // 2% of sales
        isActive: true
      }
    ];
    
    // Create all commission settings
    for (const setting of commissionSettings) {
      await prisma.commissionSettings.create({
        data: setting
      });
    }
    
    console.log('✅ Created 5 partnership program levels:');
    console.table(commissionSettings.map(s => ({
      level: s.level,
      name: s.name,
      rate: `${s.rate}%`,
      isActive: s.isActive
    })));
    
    console.log('\n✅ MCNmart Partnership Program settings created successfully');
    
  } catch (error) {
    console.error('❌ Error creating commission settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCommissionSettings();
