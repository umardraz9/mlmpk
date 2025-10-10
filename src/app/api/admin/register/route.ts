import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db as prisma } from '@/lib/db';

// Admin authorization codes (in production, store these securely)
const VALID_ADMIN_CODES = [
  'ADMIN2024MCN',
  'MCNMART_ADMIN_2024',
  'SUPER_ADMIN_MCN'
];

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, adminCode } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !password || !adminCode) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate admin authorization code
    if (!VALID_ADMIN_CODES.includes(adminCode)) {
      return NextResponse.json(
        { message: 'Invalid admin authorization code' },
        { status: 401 }
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
    if (!phoneRegex.test(phone.replace(/\s|-/g, ''))) {
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
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code
    const generateReferralCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'ADM';
      for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let referralCode = generateReferralCode();
    
    // Ensure referral code is unique
    let existingReferral = await prisma.user.findUnique({
      where: { referralCode }
    });
    
    while (existingReferral) {
      referralCode = generateReferralCode();
      existingReferral = await prisma.user.findUnique({
        where: { referralCode }
      });
    }

    // Create admin user
    const newAdmin = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashedPassword,
        referralCode,
        isAdmin: true, // Set as admin
        isActive: true,
        emailVerified: new Date(), // Auto-verify admin emails
        balance: 0,
        totalEarnings: 0,
        level: 1,
        rank: 'Administrator',
        joinedAt: new Date(),
      }
    });

    // Remove sensitive data from response
    const { password: _, ...adminData } = newAdmin;

    console.log('Admin user created successfully:', adminData.email);

    return NextResponse.json(
      { 
        message: 'Admin account created successfully',
        admin: adminData
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Admin registration error:', error);
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { message: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error during admin registration' },
      { status: 500 }
    );
  }
}
