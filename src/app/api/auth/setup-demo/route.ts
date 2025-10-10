import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    console.log('Setting up demo user...');

    // Check if demo user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demouser@example.com' }
    });

    if (existingUser) {
      console.log('Demo user exists, updating password...');
      
      // Update existing user with correct password
      const hashedPassword = await hashPassword('Demo@123456');
      
      const updatedUser = await prisma.user.update({
        where: { email: 'demouser@example.com' },
        data: {
          password: hashedPassword,
          isActive: true,
          isAdmin: true,
          name: 'Demo User',
          username: 'demouser',
          phone: '+923001234561'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Demo user updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name
        }
      });
    } else {
      console.log('Creating new demo user...');
      
      // Create new demo user
      const hashedPassword = await hashPassword('Demo@123456');
      
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
          role: 'ADMIN'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Demo user created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
        }
      });
    }

  } catch (error) {
    console.error('Demo user setup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to setup demo user',
      details: error.toString()
    }, { status: 500 });
  }
}
