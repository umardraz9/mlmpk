const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demouser@example.com' }
    });

    if (existingUser) {
      console.log('User already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Demo@123456', 12);

    // Generate referral code
    const prefix = 'DEMO';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referralCode = `${prefix}${random}`;

    // Create demo user
    const user = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: 'demouser@example.com',
        phone: '+923001234561',
        password: hashedPassword,
        referralCode: referralCode,
        isActive: true,
        isAdmin: true, // Make this user an admin for testing admin panel
      }
    });

    console.log('Demo user created successfully:', {
      id: user.id,
      email: user.email,
      referralCode: user.referralCode
    });

  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
