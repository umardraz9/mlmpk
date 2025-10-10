// Verify login functionality using Prisma client
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyLogin() {
  console.log('🔍 Verifying login functionality...');
  
  try {
    // 1. Check database connection
    console.log('\n1️⃣ Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // 2. Check if demo user exists
    console.log('\n2️⃣ Checking if demo user exists...');
    const user = await prisma.user.findUnique({
      where: {
        email: 'demouser@example.com'
      }
    });
    
    if (!user) {
      console.log('❌ Demo user not found');
      return;
    }
    
    console.log('✅ Demo user found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      balance: user.balance,
      referralCode: user.referralCode
    });
    
    // 3. Verify password hash
    console.log('\n3️⃣ Verifying password hash...');
    const isPasswordValid = await bcrypt.compare('Demo@123456', user.password);
    
    if (isPasswordValid) {
      console.log('✅ Password is valid');
    } else {
      console.log('❌ Password is invalid');
    }
    
    // 4. Check user account status
    console.log('\n4️⃣ Checking user account status...');
    if (user.emailVerified) {
      console.log('✅ Email is verified');
    } else {
      console.log('❌ Email is not verified');
    }
    
    if (user.isActive) {
      console.log('✅ Account is active');
    } else {
      console.log('❌ Account is not active');
    }
    
    // 5. Check commission settings
    console.log('\n5️⃣ Checking commission settings...');
    try {
      // Check if the CommissionSetting model exists in the schema
      const models = Object.keys(prisma);
      if (models.includes('commissionSetting')) {
        const commissionSettings = await prisma.commissionSetting.findMany();
        
        if (commissionSettings.length > 0) {
          console.log(`✅ Found ${commissionSettings.length} commission settings`);
          console.log('Commission levels:', commissionSettings.map(cs => cs.level));
        } else {
          console.log('❌ No commission settings found');
        }
      } else {
        console.log('❌ CommissionSetting model not found in schema');
        // Try to find the correct model name for commission settings
        console.log('Available models:', models.filter(m => !m.startsWith('$') && !m.startsWith('_')));
      }
    } catch (error) {
      console.log('❌ Error checking commission settings:', error.message);
    }
    
    // 6. Simulate session creation
    console.log('\n6️⃣ Simulating session creation...');
    
    // These are the fields that would be used in the session
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      isAdmin: user.isAdmin,
      balance: user.balance,
      walletBalance: user.balance, // Using balance for walletBalance
      referralCode: user.referralCode
    };
    
    // Check for undefined fields
    const undefinedFields = Object.entries(sessionUser)
      .filter(([key, value]) => value === undefined)
      .map(([key]) => key);
    
    if (undefinedFields.length > 0) {
      console.log('❌ Found undefined fields that could cause errors:', undefinedFields);
    } else {
      console.log('✅ All session user fields are defined');
    }
    
    console.log('Session user object:', sessionUser);
    
    console.log('\n✅ Login verification complete');
    
  } catch (error) {
    console.error('❌ Error verifying login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyLogin();
