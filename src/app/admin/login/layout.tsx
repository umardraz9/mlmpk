import { ReactNode } from 'react';

interface AdminLoginLayoutProps {
  children: ReactNode;
}

export default function AdminLoginLayout({ children }: AdminLoginLayoutProps) {
  // Simple layout for admin login page without authentication checks
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
