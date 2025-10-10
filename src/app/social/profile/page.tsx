"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MyProfileRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const userId = session?.user?.id;
    if (!userId) {
      router.replace('/auth/login');
    } else {
      router.replace(`/social/profile/${userId}`);
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Redirecting to your profile...
    </div>
  );
}
