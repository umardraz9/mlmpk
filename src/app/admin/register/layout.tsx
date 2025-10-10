import { ReactNode } from 'react';

interface AdminRegisterLayoutProps {
  children: ReactNode;
}

export default function AdminRegisterLayout({ children }: AdminRegisterLayoutProps) {
  // Simple layout for admin register page without authentication checks
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
