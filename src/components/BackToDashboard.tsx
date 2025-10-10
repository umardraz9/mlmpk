'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackToDashboardProps {
  className?: string;
}

export default function BackToDashboard({ className = '' }: BackToDashboardProps) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => router.back()}
      className={`mb-4 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900 shadow-sm ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Dashboard
    </Button>
  );
}
