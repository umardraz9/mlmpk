const { PrismaClient } = require('@prisma/client');

// Create a new PrismaClient instance
const prisma = new PrismaClient({
  log: ['error']
});

async function setupCommissionSettings() {
  try {
    console.log('🔧 Creating MCNmart Partnership Program Settings...');
    
    // Check existing settings
    const existingCount = await prisma.commissionSettings.count();
    console.log(`Found ${existingCount} existing commission settings`);
    
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
    const createdSettings = [];
    for (const setting of commissionSettings) {
      try {
        const created = await prisma.commissionSettings.create({
          data: {
            level: setting.level,
            rate: setting.rate,
            description: setting.description,
            isActive: setting.isActive
          }
        });
        createdSettings.push(created);
        console.log(`✅ Created Level ${setting.level}: ${setting.description}`);
      } catch (createError) {
        console.error(`❌ Failed to create Level ${setting.level}:`, createError.message);
      }
    }
    
    if (createdSettings.length > 0) {
      console.log(`\n✅ Created ${createdSettings.length} partnership program levels:`);
      console.table(createdSettings.map(s => ({
        id: s.id,
        level: s.level,
        rate: `${s.rate}%`,
        description: s.description,
        isActive: s.isActive
      })));
      
      console.log('\n✅ MCNmart Partnership Program settings created successfully');
    } else {
      console.error('❌ Failed to create any commission settings');
    }
    
  } catch (error) {
    console.error('❌ Error creating commission settings:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Execute the function
setupCommissionSettings();
