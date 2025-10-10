const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyAuthSetup() {
  try {
    console.log('🔍 Verifying database connection and authentication setup...');
    
    // 1. Check database connection
    console.log('1️⃣ Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connection successful. Found ${userCount} users.`);
    
    // 2. Check for demo user
    console.log('\n2️⃣ Checking for demo user...');
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demouser@example.com' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isAdmin: true,
        isActive: true,
        referralCode: true,
        phone: true,
        balance: true
      }
    });
    
    if (demoUser) {
      console.log('✅ Demo user found:');
      console.log({
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        isAdmin: demoUser.isAdmin,
        isActive: demoUser.isActive,
        referralCode: demoUser.referralCode,
        phone: demoUser.phone,
        balance: demoUser.balance,
        hasPassword: !!demoUser.password
      });
      
      // 3. Verify password works
      if (demoUser.password) {
        console.log('\n3️⃣ Verifying password hash...');
        const isPasswordValid = await bcrypt.compare('Demo@123456', demoUser.password);
        if (isPasswordValid) {
          console.log('✅ Password verification successful');
        } else {
          console.log('❌ Password verification failed. Hash does not match "Demo@123456"');
        }
      } else {
        console.log('❌ Demo user has no password set');
      }
    } else {
      console.log('❌ Demo user not found. Please run the create-demo-user.js script first.');
    }
    
    // 4. Check commission settings (needed for login flow)
    console.log('\n4️⃣ Checking commission settings...');
    const commissionSettings = await prisma.commissionSettings.findMany({
      orderBy: { level: 'asc' }
    });
    
    if (commissionSettings.length > 0) {
      console.log(`✅ Found ${commissionSettings.length} commission settings levels`);
    } else {
      console.log('⚠️ No commission settings found. This might affect some functionality.');
    }
    
    console.log('\n✅ Authentication setup verification complete');
    
  } catch (error) {
    console.error('❌ Error verifying authentication setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAuthSetup();
