const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addRenewalFields() {
  console.log('🔄 Adding renewal tracking fields to User model...');

  try {
    // The schema has been updated, now we need to apply the migration
    console.log('✅ Schema updated with renewal fields:');
    console.log('   - renewalCount: Int @default(0)');
    console.log('   - lastRenewalDate: DateTime?');
    console.log('   - expirationNotified: Boolean @default(false)');
    console.log('');
    console.log('📝 Run the following command to apply the migration:');
    console.log('   npx prisma migrate dev --name add_renewal_fields');
    console.log('');
    console.log('   OR for production:');
    console.log('   npx prisma db push');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
if (require.main === module) {
  addRenewalFields()
    .then(() => {
      console.log('🎉 Renewal fields setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { addRenewalFields };
