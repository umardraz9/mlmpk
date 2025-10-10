const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createTestPayment() {
  try {
    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashedpassword',
          isVerified: true
        }
      })
    }

    // Create a test payment request
    const testPayment = await prisma.transaction.create({
      data: {
        userId: testUser.id,
        type: 'MANUAL_PAYMENT',
        amount: 1000,
        status: 'PENDING',
        metadata: {
          paymentMethod: 'Bank Transfer',
          accountNumber: '1234567890',
          transactionId: 'TEST123456',
          screenshotUrl: '/images/test-payment.jpg',
          notes: 'Test payment request for approve/reject functionality testing'
        }
      }
    })

    console.log('✅ Created test payment request:', testPayment.id)
    console.log('User:', testUser.email)
    console.log('Amount: PKR', testPayment.amount)
    console.log('Status:', testPayment.status)

  } catch (error) {
    console.error('❌ Error creating test payment:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestPayment()
