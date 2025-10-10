import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// POST - Validate discount code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ 
        error: 'Discount code is required' 
      }, { status: 400 });
    }

    // Since Discount model doesn't exist in schema, return validation error
    return NextResponse.json({ 
      valid: false,
      error: 'Discount system not yet implemented in database schema' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error validating discount:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
