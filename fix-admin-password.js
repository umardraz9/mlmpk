// Fix admin user password in Supabase
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminPassword() {
  console.log('🔧 Fixing admin user password...\n');
  
  try {
    // Create a fresh password hash
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log('1. Generated new password hash');
    console.log('🔑 Password:', newPassword);
    console.log('🔐 Hash:', hashedPassword.substring(0, 20) + '...\n');
    
    // Test the hash immediately
    const testResult = await bcrypt.compare(newPassword, hashedPassword);
    console.log('2. Hash verification test:', testResult ? '✅ Valid' : '❌ Invalid');
    
    if (!testResult) {
      console.error('❌ Hash generation failed!');
      return;
    }
    
    // Update the admin user
    console.log('3. Updating admin user in database...');
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', 'admin@mlmpk.com')
      .select();
    
    if (error) {
      console.error('❌ Error updating admin user:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.error('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user password updated successfully!');
    console.log('👤 User:', data[0].name);
    console.log('📧 Email:', data[0].email);
    
    // Final verification
    console.log('\n4. Final verification...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@mlmpk.com')
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      return;
    }
    
    const finalTest = await bcrypt.compare('admin123', verifyUser.password);
    console.log('🔐 Final password test:', finalTest ? '✅ Valid' : '❌ Invalid');
    
    if (finalTest) {
      console.log('\n🎉 Admin password fix completed successfully!');
      console.log('📧 Login with: admin@mlmpk.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('\n❌ Password fix failed!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error.message);
  }
}

fixAdminPassword();
