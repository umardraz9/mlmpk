// Raw Environment Variables Check
// See exactly what Vercel is using

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    rawEnvironment: {
      DATABASE_URL: process.env.DATABASE_URL || 'undefined',
      DIRECT_URL: process.env.DIRECT_URL || 'undefined',
      // Mask passwords for security
      masked_DATABASE_URL: process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@') || 'undefined',
      masked_DIRECT_URL: process.env.DIRECT_URL?.replace(/:([^@]+)@/, ':***@') || 'undefined'
    },
    analysis: {
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      directUrlLength: process.env.DIRECT_URL?.length || 0,
      hasPassword: process.env.DATABASE_URL?.includes(':') || false,
      databaseUrlParts: process.env.DATABASE_URL?.split(':') || []
    }
  });
}
