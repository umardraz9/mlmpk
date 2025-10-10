const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAndCreateAdminUser() {
  try {
    console.log('🔍 Checking if admin user exists...');
    
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@mcnmart.com' }
    });

    if (adminUser) {
      console.log('✅ Admin user exists:');
      console.log('   ID:', adminUser.id);
      console.log('   Email:', adminUser.email);
      console.log('   Name:', adminUser.name);
      console.log('   IsAdmin:', adminUser.isAdmin);
      console.log('   Has Password:', !!adminUser.password);
      console.log('   Is Active:', adminUser.isActive);
      
      if (!adminUser.isAdmin) {
        console.log('⚠️  User exists but is not admin. Updating...');
        await prisma.user.update({
          where: { email: 'admin@mcnmart.com' },
          data: { isAdmin: true }
        });
        console.log('✅ User updated to admin');
      }
      
      return adminUser;
    } else {
      console.log('❌ Admin user does not exist. Creating...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      // Create admin user
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@mcnmart.com',
          name: 'Admin User',
          password: hashedPassword,
          isAdmin: true,
          isActive: true,
          phone: '+923001234567',
          referralCode: 'ADMIN' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          membershipStatus: 'ACTIVE',
          balance: 0.0
        }
      });
      
      console.log('✅ Admin user created successfully:');
      console.log('   ID:', newAdmin.id);
      console.log('   Email:', newAdmin.email);
      console.log('   Name:', newAdmin.name);
      console.log('   IsAdmin:', newAdmin.isAdmin);
      
      return newAdmin;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkAndCreateAdminUser()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
