// Prisma Client Configuration for Partnership Program
// This file sets up the database connection with proper singleton pattern

import { PrismaClient } from '@prisma/client';

// Extend the global object to include PrismaClient for development
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Create a singleton PrismaClient instance with optimized configuration
const baseLogs: ('error' | 'warn' | 'info' | 'query')[] =
  process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'];
const logs: Array<'error' | 'warn' | 'info' | 'query'> =
  process.env.PRISMA_LOG_QUERIES === 'true' ? [...baseLogs, 'query'] : baseLogs;

export const prisma = global.__prisma || new PrismaClient({
  log: logs,
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
  },
});

// In development, store the client on the global object to avoid re-instantiation
if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

// Commission calculation utilities for MLM
export const mlmHelpers = {
  // Calculate commission for specific level
  calculateLevelCommission: (level: number, amount: number): number => {
    const rates = {
      1: 0.20, // 20% for Level 1 (PKR 200)
      2: 0.15, // 15% for Level 2 (PKR 150)
      3: 0.10, // 10% for Level 3 (PKR 100)
      4: 0.08, // 8% for Level 4 (PKR 80)
      5: 0.07, // 7% for Level 5 (PKR 70)
    };
    return Math.round(amount * (rates[level as keyof typeof rates] || 0));
  },

  // Get all commission levels for MLM
  getCommissionLevels: () => [
    { level: 1, rate: 0.20, amount: 200 },
    { level: 2, rate: 0.15, amount: 150 },
    { level: 3, rate: 0.10, amount: 100 },
    { level: 4, rate: 0.08, amount: 80 },
    { level: 5, rate: 0.07, amount: 70 },
  ],

  // Calculate total possible commission
  getTotalPossibleCommission: (): number => {
    return 200 + 150 + 100 + 80 + 70; // PKR 600 total
  },

  // Check if user has reached maximum earning limit
  hasReachedMaxEarning: (currentEarnings: number): boolean => {
    return currentEarnings >= 3000; // PKR 3000 limit
  },

  // Calculate remaining earning capacity
  getRemainingEarningCapacity: (currentEarnings: number): number => {
    return Math.max(0, 3000 - currentEarnings);
  },
};

// Pakistani specific database helpers
export const pakistanHelpers = {
  // Format Pakistani currency
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // Validate Pakistani phone number
  isValidPakistaniPhone: (phone: string): boolean => {
    const regex = /^(\+92|0)?[0-9]{10}$/;
    return regex.test(phone.replace(/\s|-/g, ''));
  },

  // Validate Pakistani CNIC
  isValidCNIC: (cnic: string): boolean => {
    const regex = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
    return regex.test(cnic);
  },

  // Format Pakistani phone number
  formatPhoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('92')) {
      return `+92-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.startsWith('0')) {
      return `+92-${cleaned.slice(1, 4)}-${cleaned.slice(4)}`;
    }
    return phone;
  },

  // Get Pakistani cities for dropdown
  getCities: () => [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana'
  ],

  // Get Pakistani provinces
  getProvinces: () => [
    'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
    'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Kashmir'
  ],
};

// Database connection health check
export const dbHealthCheck = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

export default prisma; 