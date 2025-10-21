// Complete login fix - create user with working hash and test
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { action, email, password } = await request.json();
    
    if (action === 'create') {
      // Delete existing user
      await supabase.from('users').delete().eq('email', 'admin@mlmpk.com');
      
      // Create fresh hash
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: 'Admin User',
          email: 'admin@mlmpk.com',
          password: hashedPassword,
          role: 'ADMIN',
          isAdmin: true,
          referralCode: 'ADMIN001',
          username: 'admin',
          isActive: true,
          tasksEnabled: true,
        })
        .select()
        .single();
      
      if (createError) {
        return NextResponse.json({ success: false, error: createError.message });
      }
      
      // Test the hash immediately
      const isValid = await bcrypt.compare('admin123', hashedPassword);
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created with fresh hash',
        user: newUser,
        hashTest: isValid,
        hash: hashedPassword
      });
    }
    
    if (action === 'test') {
      // Find user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !user) {
        return NextResponse.json({
          success: false,
          error: 'User not found',
          debug: { email, userExists: false }
        });
      }
      
      // Test password
      const isValid = await bcrypt.compare(password, user.password);
      
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
          hasPassword: !!user.password,
          hashLength: user.password?.length || 0
        }
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST with action: "create" to create admin user, or action: "test" with email/password to test login'
  });
}
