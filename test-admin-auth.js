const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdminAuthentication() {
  try {
    console.log('🔐 Testing admin authentication...');
    
    const email = 'admin@mcnmart.com';
    const password = 'admin123';
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      console.log('❌ User not found');
      return false;
    }

    console.log('👤 User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   IsAdmin:', user.isAdmin);
    console.log('   Has Password:', !!user.password);
    console.log('   Is Active:', user.isActive);

    if (!user.password) {
      console.log('❌ User has no password set');
      return false;
    }

    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Password validation:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

    if (isPasswordValid && user.isAdmin) {
      console.log('🎉 Admin authentication would be successful!');
      console.log('   User object that would be returned:');
      console.log('   {');
      console.log('     id:', user.id);
      console.log('     email:', user.email);
      console.log('     name:', user.name);
      console.log('     isAdmin:', user.isAdmin);
      console.log('     role:', user.role);
      console.log('     referralCode:', user.referralCode);
      console.log('     phone:', user.phone);
      console.log('     balance:', user.balance);
      console.log('   }');
      return true;
    } else {
      console.log('❌ Authentication failed');
      if (!isPasswordValid) console.log('   Reason: Invalid password');
      if (!user.isAdmin) console.log('   Reason: User is not admin');
      return false;
    }

  } catch (error) {
    console.error('❌ Error during authentication test:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAdminAuthentication()
  .then((success) => {
    if (success) {
      console.log('\n✅ Admin authentication test PASSED');
    } else {
      console.log('\n❌ Admin authentication test FAILED');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
