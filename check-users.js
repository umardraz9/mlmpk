const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n========== REGISTERED USERS ==========\n');
    console.log(`Total Users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No users found in database.\n');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Admin: ${user.isAdmin ? 'YES' : 'NO'}`);
        console.log(`   Created: ${user.createdAt}\n`);
      });
    }

    console.log('========== NOTE ==========');
    console.log('Passwords are hashed and cannot be displayed.');
    console.log('Use the login page to test with known credentials.');
    console.log('Default test credentials (if set up):');
    console.log('  Admin: admin@mlmpk.com / admin123');
    console.log('  User: sultan@mcnmart.com / 12345678\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
