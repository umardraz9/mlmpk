// Create a proper hash for admin123
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const password = 'admin123';
    
    // Create hash using same method as your app
    const hash = await bcrypt.hash(password, 10);
    
    // Test the hash immediately
    const isValid = await bcrypt.compare(password, hash);
    
    return NextResponse.json({
      password: password,
      newHash: hash,
      testResult: isValid,
      message: isValid ? 'Hash created and verified successfully!' : 'Hash creation failed!'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
