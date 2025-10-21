// Test bcrypt with exact same setup as auth
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const password = 'admin123';
    const existingHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ4/Of/aGzic.PjFXlqeymeVGw3tZuFu';
    
    // Test existing hash
    const test1 = await bcrypt.compare(password, existingHash);
    
    // Create new hash with same rounds
    const newHash = await bcrypt.hash(password, 10);
    const test2 = await bcrypt.compare(password, newHash);
    
    // Test with different rounds
    const hash12 = await bcrypt.hash(password, 12);
    const test3 = await bcrypt.compare(password, hash12);
    
    return NextResponse.json({
      password: password,
      tests: {
        existingHash: {
          hash: existingHash,
          valid: test1
        },
        newHash10: {
          hash: newHash,
          valid: test2
        },
        newHash12: {
          hash: hash12,
          valid: test3
        }
      },
      recommendation: test1 ? existingHash : (test2 ? newHash : hash12)
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
