// Simple login endpoint that bypasses NextAuth
import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase-auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Find user
    const user = await supabaseAuth.findUserByEmail(email);
    
    if (!user || !user.password) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });
    }
    
    // Verify password
    const isValid = await supabaseAuth.verifyPassword(password, user.password);
    
    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 });
    }
    
    // Create simple session cookie
    const cookieStore = cookies();
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      role: user.role,
      loginTime: new Date().toISOString()
    };
    
    cookieStore.set('simple-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    
    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        role: user.role
      },
      redirectUrl: user.isAdmin ? '/admin/dashboard' : '/dashboard'
    });
    
  } catch (error: any) {
    console.error('Simple login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed. Please try again.'
    }, { status: 500 });
  }
}
