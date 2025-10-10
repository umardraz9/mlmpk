const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'demouser@example.com' }
    });

    if (user) {
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log('User deleted successfully');
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
