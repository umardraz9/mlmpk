// Working login that sets proper session and redirects
import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase-auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    console.log('Working login attempt:', { email });
    
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
    
    // Create session data
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        role: user.role,
        referralCode: user.referralCode,
        phone: user.phone,
        balance: user.balance
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      loginTime: new Date().toISOString()
    };
    
    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('mlmpk-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });
    
    // Determine redirect URL
    const redirectUrl = user.isAdmin ? '/admin' : '/dashboard';
    
    console.log('Login successful for:', user.email);
    
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
      redirectUrl: redirectUrl
    });
    
  } catch (error: any) {
    console.error('Working login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed. Please try again.'
    }, { status: 500 });
  }
}
