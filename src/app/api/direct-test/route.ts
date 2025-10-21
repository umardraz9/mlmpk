// Direct connection test with connection pooling
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try direct connection with connection limit
    const directUrl = `postgresql://postgres:lOEkVXWtETKcSISm@db.sfmeemhtjxwseuvzcjyd.supabase.co:5432/postgres?sslmode=require&connect_timeout=10`;
    
    const { Client } = await import('pg');
    
    const client = new Client({
      connectionString: directUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    await client.connect();
    
    // Test query
    const result = await client.query('SELECT 1 as test, version() as pg_version');
    
    await client.end();

    return NextResponse.json({
      success: true,
      message: 'Direct connection successful!',
      data: result.rows[0]
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}
