// Test current authentication setup
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔍 Testing Supabase authentication setup...\n');
  
  try {
    // Test connection
    console.log('1. Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Connected to Supabase successfully!\n');
    
    // Check if admin user exists
    console.log('2. Checking for admin user...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@mlmpk.com')
      .single();
    
    if (adminError && adminError.code !== 'PGRST116') {
      console.error('❌ Error checking admin user:', adminError.message);
      return;
    }
    
    if (!adminUser) {
      console.log('⚠️  Admin user not found. Creating admin user...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const { data: newAdmin, error: createError } = await supabase
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
        console.error('❌ Error creating admin user:', createError.message);
        return;
      }
      
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@mlmpk.com');
      console.log('🔑 Password: admin123\n');
    } else {
      console.log('✅ Admin user exists!');
      console.log('📧 Email:', adminUser.email);
      console.log('👤 Name:', adminUser.name);
      console.log('🔑 Role:', adminUser.role, '\n');
      
      // Test password verification
      console.log('3. Testing password verification...');
      const isValid = await bcrypt.compare('admin123', adminUser.password);
      console.log('🔐 Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
    }
    
    // Check total users
    console.log('4. Checking total users...');
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting users:', countError.message);
    } else {
      console.log('👥 Total users in database:', count);
    }
    
    console.log('\n🎉 Authentication test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();
