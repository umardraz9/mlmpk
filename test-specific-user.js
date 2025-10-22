// Test specific user authentication
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpecificUser() {
  console.log('🔍 Testing specific user authentication...\n');
  
  try {
    // Test sultan@mcnmart.com
    console.log('1. Testing sultan@mcnmart.com...');
    const { data: sultanUser, error: sultanError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'sultan@mcnmart.com')
      .single();
    
    if (sultanError) {
      console.error('❌ Error finding sultan user:', sultanError.message);
    } else {
      console.log('✅ Sultan user found!');
      console.log('📧 Email:', sultanUser.email);
      console.log('👤 Name:', sultanUser.name);
      console.log('🔑 Role:', sultanUser.role);
      console.log('🔐 Has Password:', !!sultanUser.password);
      
      if (sultanUser.password) {
        // Test password verification
        console.log('\n2. Testing password verification...');
        const isValid = await bcrypt.compare('12345678', sultanUser.password);
        console.log('🔐 Password "12345678" verification:', isValid ? '✅ Valid' : '❌ Invalid');
        
        if (!isValid) {
          console.log('\n3. Fixing password...');
          const newHash = await bcrypt.hash('12345678', 10);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ password: newHash })
            .eq('email', 'sultan@mcnmart.com');
          
          if (updateError) {
            console.error('❌ Error updating password:', updateError.message);
          } else {
            console.log('✅ Password updated successfully!');
            
            // Verify the new password
            const finalTest = await bcrypt.compare('12345678', newHash);
            console.log('🔐 Final password test:', finalTest ? '✅ Valid' : '❌ Invalid');
          }
        }
      } else {
        console.log('\n3. Creating password...');
        const newHash = await bcrypt.hash('12345678', 10);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ password: newHash })
          .eq('email', 'sultan@mcnmart.com');
        
        if (updateError) {
          console.error('❌ Error setting password:', updateError.message);
        } else {
          console.log('✅ Password created successfully!');
        }
      }
    }
    
    // Test admin user as well
    console.log('\n4. Testing admin user...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@mlmpk.com')
      .single();
    
    if (adminError) {
      console.error('❌ Error finding admin user:', adminError.message);
    } else {
      console.log('✅ Admin user found!');
      const adminValid = await bcrypt.compare('admin123', adminUser.password);
      console.log('🔐 Admin password verification:', adminValid ? '✅ Valid' : '❌ Invalid');
    }
    
    console.log('\n🎉 User authentication test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSpecificUser();
