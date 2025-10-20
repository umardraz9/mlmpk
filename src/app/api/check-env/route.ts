// Diagnostic endpoint to check what environment variables Vercel is using
// Access at: https://mlmpk.vercel.app/api/check-env

import { NextResponse } from 'next/server';

export async function GET() {
  // Mask passwords for security
  const maskPassword = (url: string | undefined) => {
    if (!url) return 'NOT SET';
    return url.replace(/:([^@:]+)@/, ':****@');
  };

  const envCheck = {
    DATABASE_URL: maskPassword(process.env.DATABASE_URL),
    DIRECT_URL: maskPassword(process.env.DIRECT_URL),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET (hidden)' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(envCheck, { status: 200 });
}
