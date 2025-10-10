import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    console.log('Creating demo user...');

    // Delete existing demo user if exists
    try {
      await prisma.user.delete({
        where: { email: 'demouser@example.com' }
      });
      console.log('Deleted existing demo user');
    } catch (e) {
      console.log('No existing demo user to delete');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Demo@123456', 12);
    console.log('Password hashed successfully');

    // Create new demo user
    const newUser = await prisma.user.create({
      data: {
        email: 'demouser@example.com',
        password: hashedPassword,
        name: 'Demo User',
        username: 'demouser',
        phone: '+923001234561',
        isActive: true,
        isAdmin: true,
        referralCode: 'DEMO001',
        role: 'ADMIN',
        bio: 'Demo user for MCNmart platform testing',
        totalPoints: 1000,
        balance: 500.0,
        availableVoucherPkr: 500.0
      }
    });

    console.log('Demo user created successfully:', newUser.id);

    return NextResponse.json({
      success: true,
      message: 'Demo user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username
      },
      credentials: {
        email: 'demouser@example.com',
        password: 'Demo@123456'
      }
    });

  } catch (error) {
    console.error('Demo user creation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create demo user',
      details: error.toString()
    }, { status: 500 });
  }
}
