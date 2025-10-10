import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name
        }
      });
    }

    // Create admin user
    const hashedPassword = await hashPassword('admin123');
    
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@mlmpak.com',
        password: hashedPassword,
        isAdmin: true,
        isActive: true,
        role: 'ADMIN',
        referralCode: 'ADMIN001'
      }
    });

    return NextResponse.json({ 
      message: 'Admin user created successfully',
      admin: {
        email: adminUser.email,
        name: adminUser.name,
        password: 'admin123' // Only show in response for initial setup
      }
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
} 