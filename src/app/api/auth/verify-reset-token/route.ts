import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    // Find all password reset records (since we hash tokens, we need to check each one)
    const resetRecords = await prisma.passwordReset.findMany({
      where: {
        expiresAt: {
          gt: new Date() // Only get non-expired tokens
        }
      }
    });

    // Check if any token matches
    let validRecord = null;
    for (const record of resetRecords) {
      const isValid = await bcrypt.compare(token, record.token);
      if (isValid) {
        validRecord = record;
        break;
      }
    }

    if (!validRecord) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: 'Token is valid',
      email: validRecord.email 
    });

  } catch (error) {
    logger.error('Token verification error', error, 'AUTH');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
