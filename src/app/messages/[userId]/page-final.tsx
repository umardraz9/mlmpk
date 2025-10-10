'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserMessagePage({ params }: { params: { userId: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to working test messaging page
    router.push('/test-messaging');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Redirecting to messaging...</p>
      </div>
    </div>
  );
}
