// Comprehensive authentication test
import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/lib/supabase-auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const testEmail = 'admin@mlmpk.com';
    const testPassword = 'admin123';
    
    console.log('🔍 Starting comprehensive auth test...');
    
    // Test 1: Find user
    const user = await supabaseAuth.findUserByEmail(testEmail);
    const test1 = {
      name: 'Find User',
      success: !!user,
      details: user ? {
        id: user.id,
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password?.length || 0,
        isAdmin: user.isAdmin,
        role: user.role
      } : 'User not found'
    };
    
    // Test 2: Password verification
    let test2 = { name: 'Password Verification', success: false, details: 'User not found' };
    if (user && user.password) {
      const isValid = await supabaseAuth.verifyPassword(testPassword, user.password);
      test2 = {
        name: 'Password Verification',
        success: isValid,
        details: {
          passwordValid: isValid,
          hashPrefix: user.password.substring(0, 10),
          hashLength: user.password.length
        }
      };
    }
    
    // Test 3: Direct bcrypt test
    let test3 = { name: 'Direct bcrypt Test', success: false, details: 'No password hash' };
    if (user && user.password) {
      const directTest = await bcrypt.compare(testPassword, user.password);
      test3 = {
        name: 'Direct bcrypt Test',
        success: directTest,
        details: {
          directBcryptResult: directTest,
          hash: user.password
        }
      };
    }
    
    // Test 4: Create fresh hash and compare
    const freshHash = await bcrypt.hash(testPassword, 10);
    const freshTest = await bcrypt.compare(testPassword, freshHash);
    const test4 = {
      name: 'Fresh Hash Test',
      success: freshTest,
      details: {
        freshHash: freshHash,
        freshHashValid: freshTest
      }
    };
    
    const allTestsPassed = test1.success && test2.success && test3.success && test4.success;
    
    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed ? 'All authentication tests passed!' : 'Some tests failed',
      timestamp: new Date().toISOString(),
      tests: [test1, test2, test3, test4],
      recommendation: allTestsPassed ? 'Authentication should work' : 'Need to fix authentication',
      credentials: {
        email: testEmail,
        password: testPassword
      }
    });
    
  } catch (error: any) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
