// Test password hash verification
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const password = 'admin123';
    const hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    
    // Also create a new hash for comparison
    const newHash = await bcrypt.hash(password, 10);
    const newHashValid = await bcrypt.compare(password, newHash);
    
    return NextResponse.json({
      password: password,
      existingHash: hash,
      existingHashValid: isValid,
      newHash: newHash,
      newHashValid: newHashValid,
      message: isValid ? 'Existing hash is valid!' : 'Existing hash is INVALID!'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
