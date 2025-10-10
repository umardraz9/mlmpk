/*
  Seed active PaymentSettings for wallets with monthly limits.
  - JazzCash (PKR 200,000)
  - EasyPaisa (PKR 200,000)
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upsertPaymentSetting({
  type,
  accountTitle,
  accountNumber,
  bankName = null,
  branchCode = null,
  iban = null,
  instructions = null,
  displayOrder = 0,
  monthlyLimitPkr = 200000,
}) {
  const existing = await prisma.paymentSettings.findFirst({
    where: {
      type,
      accountNumber,
    },
  });

  if (existing) {
    const updated = await prisma.paymentSettings.update({
      where: { id: existing.id },
      data: {
        accountTitle,
        bankName,
        branchCode,
        iban,
        instructions,
        isActive: true,
        displayOrder,
        monthlyLimitPkr,
      },
    });
    return { action: 'updated', record: updated };
  }

  const created = await prisma.paymentSettings.create({
    data: {
      type,
      accountTitle,
      accountNumber,
      bankName,
      branchCode,
      iban,
      instructions,
      isActive: true,
      displayOrder,
      monthlyLimitPkr,
    },
  });
  return { action: 'created', record: created };
}

async function main() {
  const results = [];

  results.push(
    await upsertPaymentSetting({
      type: 'JAZZCASH',
      accountTitle: 'MCNmart Admin',
      accountNumber: '03001234567',
      instructions: 'Send payment to this JazzCash number and upload screenshot',
      displayOrder: 0,
      monthlyLimitPkr: 200000,
    })
  );

  results.push(
    await upsertPaymentSetting({
      type: 'EASYPAISA',
      accountTitle: 'MCNmart Admin',
      accountNumber: '03009876543',
      instructions: 'Send payment to this EasyPaisa number and upload screenshot',
      displayOrder: 1,
      monthlyLimitPkr: 200000,
    })
  );

  console.log('Seed results:', results.map(r => ({ action: r.action, id: r.record.id, type: r.record.type, monthlyLimitPkr: r.record.monthlyLimitPkr })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
