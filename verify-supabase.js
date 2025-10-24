const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env.example
const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySupabase() {
  console.log('\n========== SUPABASE DATABASE VERIFICATION ==========\n');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Status: Checking connection...\n`);

  try {
    // Test connection by querying users table
    const { data, error, status } = await supabase
      .from('users')
      .select('id, email, name, role, isAdmin')
      .limit(10);

    if (error) {
      console.log('❌ CONNECTION FAILED');
      console.log(`Error Code: ${error.code}`);
      console.log(`Error Message: ${error.message}`);
      console.log(`Status: ${status}\n`);
      
      console.log('POSSIBLE CAUSES:');
      console.log('1. Supabase project is not accessible');
      console.log('2. Network connection issue');
      console.log('3. Invalid API key');
      console.log('4. Database tables not created\n');
      
      return false;
    }

    console.log('✅ CONNECTION SUCCESSFUL\n');
    console.log(`Users in Supabase: ${data ? data.length : 0}`);
    
    if (data && data.length > 0) {
      console.log('\nUsers Found:');
      data.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.name || 'N/A'})`);
      });
    } else {
      console.log('No users found in Supabase database.');
    }

    // Check other tables
    console.log('\n========== TABLE STATUS ==========\n');
    
    const tables = [
      'products',
      'orders',
      'tasks',
      'blog_posts',
      'notifications',
      'membership_plans'
    ];

    for (const table of tables) {
      try {
        const { count, error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (tableError) {
          console.log(`❌ ${table}: Table not found or error`);
        } else {
          console.log(`✅ ${table}: ${count} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Error checking table`);
      }
    }

    console.log('\n========== RECOMMENDATION ==========\n');
    console.log('Current Setup:');
    console.log('- Local Database: SQLite (prisma/dev.db)');
    console.log('- Supabase Status: Connected but may need data sync\n');
    
    console.log('To migrate data to Supabase:');
    console.log('1. Update prisma/schema.prisma datasource to use Supabase URL');
    console.log('2. Run: npx prisma db push');
    console.log('3. Run: npx prisma db seed (if seed file exists)');
    console.log('4. Verify data with: npx prisma studio\n');

    return true;

  } catch (error) {
    console.log('❌ VERIFICATION ERROR');
    console.log(`Error: ${error.message}\n`);
    return false;
  }
}

verifySupabase();
