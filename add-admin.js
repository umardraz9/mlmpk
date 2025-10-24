const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@mlmpk.com' }
    });

    if (existingAdmin) {
      console.log('\n✓ Admin user already exists!');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.name}`);
      console.log(`  Admin: ${existingAdmin.isAdmin ? 'YES' : 'NO'}\n`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@mlmpk.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        isAdmin: true,
        emailVerified: new Date(),
        referralCode: 'ADMIN' + Math.random().toString(36).substring(7).toUpperCase(),
      }
    });

    console.log('\n✓ Admin user created successfully!');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: admin123`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  Role: ${admin.role}\n`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
