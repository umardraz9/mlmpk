// Debug login endpoint to test authentication
import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    console.log('Login attempt:', { email });
    
    // Find user
    const user = await supabaseAuth.findUserByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: { email, userExists: false }
      });
    }
    
    console.log('User data:', {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0
    });
    
    // Verify password
    const isValid = await supabaseAuth.verifyPassword(password, user.password);
    console.log('Password valid:', isValid);
    
    return NextResponse.json({
      success: isValid,
      user: isValid ? {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        role: user.role
      } : null,
      debug: {
        email,
        userExists: true,
        passwordValid: isValid,
        hasPassword: !!user.password
      }
    });
    
  } catch (error: any) {
    console.error('Debug login error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with { email, password } to debug login'
  });
}
