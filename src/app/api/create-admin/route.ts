// Create Admin User Endpoint
// Run once: https://mlmpk.vercel.app/api/create-admin

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@mlmpk.com' }
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists!',
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          name: existingAdmin.name
        }
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@mlmpk.com',
        password: hashedPassword,
        role: 'ADMIN',
        isAdmin: true,
        referralCode: 'ADMIN001',
        username: 'admin',
        isActive: true,
        tasksEnabled: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully!',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        credentials: {
          email: 'admin@mlmpk.com',
          password: 'admin123'
        }
      }
    });

  } catch (error: any) {
    console.error('Admin creation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}
