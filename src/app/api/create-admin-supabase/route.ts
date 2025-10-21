// Create admin using Supabase client instead of Prisma
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('User')
      .select('*')
      .eq('email', 'admin@mlmpk.com')
      .single();
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists!',
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          name: existingAdmin.name
        }
      });
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const { data: admin, error: createError } = await supabase
      .from('User')
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
      return NextResponse.json({
        success: false,
        error: createError.message,
        details: createError
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully using Supabase client!',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        credentials: {
          email: 'admin@mlmpk.com',
          password: 'admin123'
        }
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
