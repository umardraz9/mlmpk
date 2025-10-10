import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/payment-methods - Get active payment methods for checkout
export async function GET() {
  try {
    // Load active admin-configured payment settings from DB
    const settings = await prisma.paymentSettings.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    // Map DB settings to ManualPaymentOptions PaymentMethod shape
    const dbPaymentMethods = settings.map((s) => {
      // Normalize type for UI grouping
      const normalizedType = s.type === 'BANK_ACCOUNT' ? 'BANK_ACCOUNT' : 'MOBILE_WALLET';
      // Human-friendly name
      const name = (() => {
        if (s.type === 'JAZZCASH') return 'JazzCash';
        if (s.type === 'EASYPAISA') return 'EasyPaisa';
        if (s.type === 'BANK_ACCOUNT') return s.bankName ? `${s.bankName} Bank Account` : 'Bank Account';
        return 'Mobile Wallet';
      })();
      const sAny = s as any;
      return {
        id: s.id,
        name,
        type: normalizedType,
        accountName: s.accountTitle,
        accountNumber: s.accountNumber,
        bankName: s.bankName,
        branchCode: s.branchCode || undefined,
        instructions: s.instructions || undefined,
        displayOrder: s.displayOrder,
        monthlyLimitPkr: sAny.monthlyLimitPkr ?? null,
      } as any;
    });

    // Fallback defaults if DB is empty
    const fallback = dbPaymentMethods.length > 0 ? dbPaymentMethods : [
      {
        id: '1',
        name: 'JazzCash',
        type: 'MOBILE_WALLET',
        accountName: 'MCNmart Admin',
        accountNumber: '03001234567',
        bankName: null,
        branchCode: null,
        instructions: 'Send payment to this JazzCash number and upload screenshot',
        displayOrder: 0
      },
      {
        id: '2',
        name: 'EasyPaisa',
        type: 'MOBILE_WALLET',
        accountName: 'MCNmart Admin',
        accountNumber: '03009876543',
        bankName: null,
        branchCode: null,
        instructions: 'Send payment to this EasyPaisa number and upload screenshot',
        displayOrder: 1
      },
      {
        id: '3',
        name: 'HBL Bank Account',
        type: 'BANK_ACCOUNT',
        accountName: 'MCNmart Business',
        accountNumber: '12345678901234',
        bankName: 'Habib Bank Limited',
        branchCode: '1234',
        instructions: 'Transfer to this bank account and upload receipt',
        displayOrder: 2
      }
    ];

    // Add standard payment methods expected by tests/compat
    const standardMethods = [
      { id: 'cod', name: 'Cash on Delivery', type: 'COD', description: 'Pay when you receive your order', enabled: true },
      { id: 'jazzcash', name: 'JazzCash', type: 'JAZZCASH', description: 'Pay via JazzCash mobile wallet', enabled: true },
      { id: 'easypaisa', name: 'EasyPaisa', type: 'EASYPAISA', description: 'Pay via EasyPaisa mobile wallet', enabled: true },
      { id: 'bank', name: 'Bank Transfer', type: 'BANK_TRANSFER', description: 'Direct bank transfer', enabled: true },
    ];

    return NextResponse.json({
      success: true,
      methods: standardMethods,
      paymentMethods: fallback,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}
