import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { email: validRecord.email },
      data: { password: hashedPassword }
    });

    // Delete the used reset token
    await prisma.passwordReset.delete({
      where: { id: validRecord.id }
    });

    // Clean up any other expired tokens for this email
    await prisma.passwordReset.deleteMany({
      where: {
        email: validRecord.email,
        expiresAt: {
          lt: new Date()
        }
      }
    });

    logger.info('Password reset completed', { email: validRecord.email }, 'AUTH');

    return NextResponse.json({
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    logger.error('Password reset error', error, 'AUTH');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
