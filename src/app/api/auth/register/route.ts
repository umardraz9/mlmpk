import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAuth } from '@/lib/supabase-auth';

// Ensure this route runs on Node.js runtime (not Edge)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
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
    const existingUser = await supabaseAuth.findUserByEmail(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Resolve referrer code - default to admin referral code
    let referrerCodeToApply: string = 'ADMIN001'; // Default to admin
    if (referralCode && typeof referralCode === 'string' && referralCode.trim().length > 0) {
      // For now, we'll accept any referral code and validate later
      // In a full implementation, you'd check if the referral code exists
      referrerCodeToApply = referralCode.trim();
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
    
    // Simple unique suffix for referral code
    const suffix = Math.floor(Math.random() * 90 + 10).toString();
    userReferralCode = `${userReferralCode}-${suffix}`;

    // Create user using Supabase
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: normalizedPhone.trim(),
      password: hashedPassword,
      referralCode: userReferralCode,
      referredBy: referrerCodeToApply,
      isActive: true,
      role: 'USER',
      isAdmin: false,
      membershipStatus: 'INACTIVE',
      balance: 0,
      tasksEnabled: false
    };

    const user = await supabaseAuth.createUser(userData);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Failed to create user. Please try again.' },
        { status: 500 }
      );
    }

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
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
      });
      
      // Handle specific errors
      if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
        return NextResponse.json(
          { message: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
} 