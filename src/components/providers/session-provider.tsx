'use client';

import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Removed NextAuth SessionProvider since we're using custom session management
  // Our custom useSession hook reads directly from cookies
  return (
    <>
      {children}
    </>
  );
}