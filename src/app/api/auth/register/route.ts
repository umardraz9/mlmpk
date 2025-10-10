import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db as prisma, testDatabaseConnection } from '@/lib/db';

// Ensure this route runs on Node.js runtime (not Edge)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('Database connection failed during registration');
      return NextResponse.json(
        { message: 'Database connection error. Please try again later.' },
        { status: 500 }
      );
    }

    const { name, email, phone, password, referralCode } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { message: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate Pakistani phone number
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    const normalizedPhone = phone.replace(/\s|-/g, '');
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        { message: 'Invalid Pakistani phone number format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { phone: normalizedPhone }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Resolve referrer code
    let referrerCodeToApply: string | null = null;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim().length > 0) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.trim() } });
      if (!referrer) {
        return NextResponse.json(
          { message: 'Invalid referral code' },
          { status: 400 }
        );
      }
      referrerCodeToApply = referrer.referralCode;
    } else {
      // No referral provided: default to admin referral code "admin123"
      const adminUser = await prisma.user.findUnique({ where: { referralCode: 'admin123' } });
      if (adminUser) {
        referrerCodeToApply = adminUser.referralCode;
      } else {
        // Fallback: try to find any admin user
        const anyAdmin = await prisma.user.findFirst({ where: { isAdmin: true } });
        referrerCodeToApply = anyAdmin ? anyAdmin.referralCode : null;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate memorable referral code: first 3 letters of name + '-' + last 4 digits of phone (e.g., "ALI-8743")
    const sanitizeName = (n: string) => n.replace(/[^A-Za-z]/g, '');
    const generateMemorableReferralCode = (fullName: string, rawPhone: string) => {
      const cleanName = sanitizeName(fullName || '').toUpperCase();
      const prefix = (cleanName.substring(0, 3) || 'USR').padEnd(3, 'X');
      const digits = (rawPhone || '').replace(/\D/g, '');
      const last4 = (digits.slice(-4) || '0000').padStart(4, '0');
      return `${prefix}-${last4}`;
    };

    let userReferralCode = generateMemorableReferralCode(name, normalizedPhone);
    
    // Ensure referral code is unique
    while (await prisma.user.findUnique({ where: { referralCode: userReferralCode } })) {
      // If collision, append a short 2-digit suffix to keep it simple
      const suffix = Math.floor(Math.random() * 90 + 10).toString(); // 10-99
      userReferralCode = `${generateMemorableReferralCode(name, normalizedPhone)}-${suffix}`;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: normalizedPhone.trim(),
        password: hashedPassword,
        referralCode: userReferralCode,
        referredBy: referrerCodeToApply,
        isActive: true,
        membershipStatus: 'INACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      message: 'Registration successful! Please sign in.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Handle specific Prisma errors
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { message: 'User with this email or phone already exists' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Database')) {
        return NextResponse.json(
          { message: 'Database error. Please try again later.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
} 