'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserMessagePage({ params }: { params: { userId: string } }) {
  const router = useRouter();

  // Redirect to main messages page with user parameter (in effect to avoid render-time navigation)
  useEffect(() => {
    if (params?.userId) {
      router.replace(`/messages?userId=${params.userId}`);
    }
  }, [params?.userId, router]);

  return null;
}
