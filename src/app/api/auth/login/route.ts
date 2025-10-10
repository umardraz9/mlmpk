import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';

// This endpoint is for custom login handling if needed
// The main authentication should go through NextAuth at /api/auth/[...nextauth]
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // For NextAuth integration, redirect to use the proper NextAuth endpoints
    return NextResponse.json({
      message: 'Please use NextAuth endpoints for authentication',
      redirectTo: '/api/auth/signin'
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 