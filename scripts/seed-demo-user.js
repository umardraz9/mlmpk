const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    console.log('🔧 Creating demo user...');

    // Delete existing demo user if exists
    try {
      await prisma.user.deleteMany({
        where: { 
          OR: [
            { email: 'demouser@example.com' },
            { username: 'demouser' }
          ]
        }
      });
      console.log('✅ Deleted existing demo user');
    } catch (e) {
      console.log('ℹ️  No existing demo user to delete');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Demo@123456', 12);
    console.log('✅ Password hashed successfully');

    // Create new demo user
    const newUser = await prisma.user.create({
      data: {
        email: 'demouser@example.com',
        password: hashedPassword,
        name: 'Demo User',
        username: 'demouser',
        phone: '+923001234561',
        isActive: true,
        isAdmin: true,
        referralCode: 'DEMO001',
        role: 'ADMIN',
        bio: 'Demo user for MCNmart platform testing',
        totalPoints: 1000,
        balance: 500.0,
        availableVoucherPkr: 500.0,
        profileVisibility: 'public',
        emailNotifications: true,
        pushNotifications: true,
        partnerLevel: 'Gold',
        teamRole: 'Admin'
      }
    });

    console.log('✅ Demo user created successfully!');
    console.log('📧 Email: demouser@example.com');
    console.log('🔑 Password: Demo@123456');
    console.log('🆔 User ID:', newUser.id);

    // Test password verification
    const isValid = await bcrypt.compare('Demo@123456', newUser.password);
    console.log('🔍 Password verification test:', isValid ? '✅ PASSED' : '❌ FAILED');

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
