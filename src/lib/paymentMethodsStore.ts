export interface PaymentMethodEntry {
  id: string;
  name: string;
  type: 'MOBILE_WALLET' | 'BANK_ACCOUNT' | 'OTHER' | string;
  accountName: string;
  accountNumber: string;
  bankName?: string | null;
  branchCode?: string | null;
  instructions?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  creator: { name: string; email: string };
  monthlyLimitPkr?: number | null;
}

// Shared in-memory store for admin + public APIs (dev-mode convenience)
export const paymentMethodsStore: PaymentMethodEntry[] = [
  {
    id: '1',
    name: 'JazzCash',
    type: 'MOBILE_WALLET',
    accountName: 'MCNmart Admin',
    accountNumber: '03001234567',
    bankName: null,
    branchCode: null,
    instructions: 'Send payment to this JazzCash number and upload screenshot',
    isActive: true,
    monthlyLimitPkr: 200000,
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: { name: 'Admin', email: 'admin@mcnmart.com' },
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
    isActive: true,
    monthlyLimitPkr: 200000,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: { name: 'Admin', email: 'admin@mcnmart.com' },
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
    isActive: true,
    monthlyLimitPkr: null,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: { name: 'Admin', email: 'admin@mcnmart.com' },
  },
];
