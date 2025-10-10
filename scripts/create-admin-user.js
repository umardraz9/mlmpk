/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

function generateStrongPassword(length = 16) {
  // Generate a URL-safe random string, alphanumeric only
  return crypto
    .randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length);
}

async function createAdminUser() {
  try {
    // Read admin credentials from environment (set these before running the script)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@mcnmart.com';
    const plainPassword = process.env.ADMIN_PASSWORD || '';
    const useGenerated = !plainPassword || plainPassword.length < 8;
    const finalPassword = useGenerated ? generateStrongPassword(18) : plainPassword;
    const hashedPassword = await bcrypt.hash(finalPassword, 12);
    const referralCode = process.env.ADMIN_REFERRAL || ('ADMIN' + Math.random().toString(36).slice(2, 8).toUpperCase());

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      // Update existing user to be admin
      const updatedAdmin = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          isAdmin: true,
          role: 'ADMIN',
          isActive: true,
          password: hashedPassword
        }
      });
      console.log('✅ Existing user updated to admin:');
      console.log('Email:', adminEmail);
      if (useGenerated) {
        console.log('Temporary Password:', finalPassword);
        console.log('Note: Please change this password after first login.');
      } else {
        console.log('Password set from ADMIN_PASSWORD environment variable.');
      }
      console.log('Admin ID:', updatedAdmin.id);
    } else {
      // Create new admin user
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          username: 'admin_' + Date.now(),
          firstName: 'Admin',
          lastName: 'User',
          phone: '+92 300 9876543',
          isActive: true,
          isAdmin: true,
          role: 'ADMIN',
          balance: 0,
          totalEarnings: 0,
          availableVoucherPkr: 0,
          referralCode
        }
      });

      console.log('✅ Admin user created successfully:');
      console.log('Email:', adminEmail);
      if (useGenerated) {
        console.log('Temporary Password:', finalPassword);
        console.log('Note: Please change this password after first login.');
      } else {
        console.log('Password set from ADMIN_PASSWORD environment variable.');
      }
      console.log('Admin ID:', adminUser.id);
    }

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
