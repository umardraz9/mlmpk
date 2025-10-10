import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Delete any existing reset tokens for this email
    await prisma.passwordReset.deleteMany({
      where: { email: email.toLowerCase() }
    });

    // Save token to database
    await prisma.passwordReset.create({
      data: {
        email: email.toLowerCase(),
        token: hashedToken,
        expiresAt: resetTokenExpiry,
      }
    });

    // Log for development (remove in production)
    logger.info('Password reset requested', { 
      email: email.toLowerCase(),
      resetLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
    }, 'AUTH');

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    });

  } catch (error) {
    logger.error('Forgot password error', error, 'AUTH');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 