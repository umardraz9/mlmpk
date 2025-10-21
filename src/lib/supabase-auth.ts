// Supabase-based authentication to replace Prisma
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(supabaseUrl, supabaseKey);

export const supabaseAuth = {
  // Find user by email
  async findUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();
      
      if (error) {
        console.error('Error finding user:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in findUserByEmail:', error);
      return null;
    }
  },

  // Verify password with detailed logging
  async verifyPassword(password: string, hashedPassword: string) {
    try {
      console.log('Verifying password:', { 
        passwordLength: password.length, 
        hashLength: hashedPassword.length,
        hashPrefix: hashedPassword.substring(0, 10)
      });
      
      const result = await bcrypt.compare(password, hashedPassword);
      console.log('Password verification result:', result);
      return result;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  },

  // Create a fresh admin user with proper hash
  async createFreshAdmin() {
    try {
      // Delete existing admin
      await supabase.from('users').delete().eq('email', 'admin@mlmpk.com');
      
      // Create fresh hash
      const hashedPassword = await bcrypt.hash('admin123', 10);
      console.log('Created fresh hash:', hashedPassword);
      
      // Verify hash immediately
      const testResult = await bcrypt.compare('admin123', hashedPassword);
      console.log('Hash test result:', testResult);
      
      if (!testResult) {
        throw new Error('Hash verification failed immediately after creation');
      }
      
      // Create user
      const { data, error } = await supabase
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
      
      if (error) {
        console.error('Error creating admin:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createFreshAdmin:', error);
      return null;
    }
  },

  // Create user
  async createUser(userData: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createUser:', error);
      return null;
    }
  },

  // Update user
  async updateUser(id: string, userData: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateUser:', error);
      return null;
    }
  }
};

export default supabaseAuth;
