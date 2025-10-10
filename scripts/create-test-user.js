const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@mcnmart.com',
        password: hashedPassword,
        username: 'testuser' + Date.now(),
        firstName: 'Test',
        lastName: 'User',
        phone: '+92 300 1234567',
        isActive: true,
        isAdmin: false,
        balance: 30, // Starting with 30 PKR from task completion
        totalEarnings: 30,
        availableVoucherPkr: 0,
        referralCode: 'TEST123'
      }
    });

    console.log('✅ Test user created successfully:');
    console.log('Email: test@mcnmart.com');
    console.log('Password: password123');
    console.log('Balance: PKR 30');
    console.log('User ID:', user.id);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@mcnmart.com',
        password: hashedPassword,
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+92 300 9876543',
        isActive: true,
        isAdmin: true,
        balance: 0,
        totalEarnings: 0,
        availableVoucherPkr: 0,
        referralCode: 'ADMIN123'
      }
    });

    console.log('✅ Admin user created successfully:');
    console.log('Email: admin@mcnmart.com');
    console.log('Password: password123');
    console.log('Admin ID:', adminUser.id);

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
