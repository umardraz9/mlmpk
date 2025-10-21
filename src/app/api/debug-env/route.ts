// Debug Environment Variables
// Check what DATABASE_URL Vercel is actually using

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbPoolUrl = process.env.DB_POOL_URL || process.env.DATABASE_URL;
    const databaseUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;
    
    // Mask password for security
    const maskUrl = (url: string | undefined) => {
      if (!url) return 'undefined';
      return url.replace(/:([^@]+)@/, ':***@');
    };
    
    // Parse connection details (safe fields only)
    let dbUser: string | null = null;
    let dbHost: string | null = null;
    let dbPort: string | null = null;
    let dbName: string | null = null;
    try {
      if (dbPoolUrl) {
        const parsed = new URL(dbPoolUrl);
        dbUser = parsed.username || null;
        dbHost = parsed.hostname || null;
        dbPort = parsed.port || null;
        dbName = (parsed.pathname || '').replace(/^\//, '') || null;
      }
    } catch (_) {
      // ignore parse errors
    }

    return NextResponse.json({
      success: true,
      environment: {
        DB_POOL_URL: maskUrl(process.env.DB_POOL_URL),
        DATABASE_URL: maskUrl(databaseUrl),
        DIRECT_URL: maskUrl(directUrl),
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      },
      analysis: {
        hasDbPoolUrl: !!process.env.DB_POOL_URL,
        hasDatabaseUrl: !!databaseUrl,
        hasDirectUrl: !!directUrl,
        databaseUrlType: dbPoolUrl?.includes('pooler') ? 'pooler' : 
                        dbPoolUrl?.includes('db.') ? 'direct' : 'unknown',
        port: dbPoolUrl?.match(/:(\d+)\//)?.[1] || 'unknown',
        dbUser,
        dbHost,
        dbPort,
        dbName
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
