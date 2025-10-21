// Reset admin user with fresh hash
import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Starting admin reset...');
    
    // Create fresh admin user
    const admin = await supabaseAuth.createFreshAdmin();
    
    if (!admin) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create admin user'
      });
    }
    
    console.log('Admin created successfully:', admin.email);
    
    // Test login immediately
    const loginTest = await supabaseAuth.findUserByEmail('admin@mlmpk.com');
    if (!loginTest) {
      return NextResponse.json({
        success: false,
        error: 'Admin created but cannot find user'
      });
    }
    
    const passwordTest = await supabaseAuth.verifyPassword('admin123', loginTest.password);
    
    return NextResponse.json({
      success: true,
      message: 'Admin user reset successfully!',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        isAdmin: admin.isAdmin,
        role: admin.role
      },
      loginTest: {
        userFound: !!loginTest,
        passwordValid: passwordTest,
        hasPassword: !!loginTest.password
      },
      credentials: {
        email: 'admin@mlmpk.com',
        password: 'admin123'
      }
    });
    
  } catch (error: any) {
    console.error('Reset admin error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
