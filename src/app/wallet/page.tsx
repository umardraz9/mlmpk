'use client';

import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Wallet from '@/components/Wallet';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BackToDashboard from '@/components/BackToDashboard';

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BackToDashboard />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Wallet
          </h1>
          <p className="text-gray-600">
            Manage your earnings and financial transactions
          </p>
        </div>

        <Wallet />
      </div>
    </div>
  );
}
