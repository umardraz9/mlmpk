'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wallet from '@/components/Wallet';

export default function WithdrawPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Withdraw Money
          </h1>
          <p className="text-gray-600">
            Request withdrawals from your available balance
          </p>
        </div>

        <Wallet />
      </div>
    </div>
  );
}
