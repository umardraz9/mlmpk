const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPaymentMethods() {
  try {
    console.log('🔧 Seeding payment methods...');

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { isAdmin: true }
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    // Clear existing payment methods
    await prisma.paymentMethod.deleteMany({});
    console.log('✅ Cleared existing payment methods');

    // Default payment methods
    const paymentMethods = [
      {
        name: 'JazzCash',
        type: 'mobile_wallet',
        accountName: 'MCNmart Admin',
        accountNumber: '+92 300 1234567',
        instructions: 'Send payment to this JazzCash number. Please include your name in the transaction note.',
        isActive: true,
        displayOrder: 1,
        createdBy: adminUser.id
      },
      {
        name: 'EasyPaisa',
        type: 'mobile_wallet',
        accountName: 'MCNmart Admin',
        accountNumber: '+92 301 7654321',
        instructions: 'Send payment to this EasyPaisa number. Make sure to save the transaction ID.',
        isActive: true,
        displayOrder: 2,
        createdBy: adminUser.id
      },
      {
        name: 'HBL Bank Account',
        type: 'bank_account',
        accountName: 'MCNmart Partnership Program',
        accountNumber: '12345678901234',
        bankName: 'Habib Bank Limited',
        branchCode: '1234',
        instructions: 'Transfer to this bank account. Please mention your registered email in the transaction details.',
        isActive: true,
        displayOrder: 3,
        createdBy: adminUser.id
      },
      {
        name: 'UBL Bank Account',
        type: 'bank_account',
        accountName: 'MCNmart Partnership Program',
        accountNumber: '98765432109876',
        bankName: 'United Bank Limited',
        branchCode: '5678',
        instructions: 'Bank transfer to UBL account. Keep the transaction receipt for verification.',
        isActive: true,
        displayOrder: 4,
        createdBy: adminUser.id
      },
      {
        name: 'SadaPay',
        type: 'mobile_wallet',
        accountName: 'MCNmart Admin',
        accountNumber: '+92 302 9876543',
        instructions: 'Send payment via SadaPay. Screenshot the payment confirmation.',
        isActive: true,
        displayOrder: 5,
        createdBy: adminUser.id
      }
    ];

    // Create payment methods
    for (const method of paymentMethods) {
      await prisma.paymentMethod.create({
        data: method
      });
      console.log(`✅ Created payment method: ${method.name}`);
    }

    console.log('🎉 Payment methods seeded successfully!');
    console.log(`📊 Total methods created: ${paymentMethods.length}`);

  } catch (error) {
    console.error('❌ Error seeding payment methods:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPaymentMethods();
