'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import React from 'react';
import FacebookHeader from '@/components/layout/FacebookHeader';

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <FacebookHeader />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
