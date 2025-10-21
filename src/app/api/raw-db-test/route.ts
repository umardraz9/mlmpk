// Raw Database Test - No Prisma
// Direct PostgreSQL connection test

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL not found'
      });
    }

    // Import pg dynamically to avoid build issues
    const { Client } = await import('pg');
    
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    
    // Simple test query
    const result = await client.query('SELECT 1 as test, current_database() as db_name, current_user as user_name');
    
    await client.end();

    return NextResponse.json({
      success: true,
      message: 'Raw database connection successful!',
      data: result.rows[0],
      connectionInfo: {
        maskedUrl: databaseUrl.replace(/:([^@]+)@/, ':***@')
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.detail || 'No additional details'
    }, { status: 500 });
  }
}
