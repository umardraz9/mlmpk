// Debug Environment Variables
// Check what DATABASE_URL Vercel is actually using

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;
    
    // Mask password for security
    const maskUrl = (url: string | undefined) => {
      if (!url) return 'undefined';
      return url.replace(/:([^@]+)@/, ':***@');
    };

    return NextResponse.json({
      success: true,
      environment: {
        DATABASE_URL: maskUrl(databaseUrl),
        DIRECT_URL: maskUrl(directUrl),
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      },
      analysis: {
        hasDatabaseUrl: !!databaseUrl,
        hasDirectUrl: !!directUrl,
        databaseUrlType: databaseUrl?.includes('pooler') ? 'pooler' : 
                        databaseUrl?.includes('db.') ? 'direct' : 'unknown',
        port: databaseUrl?.match(/:(\d+)\//)?.[1] || 'unknown'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
