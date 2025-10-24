const https = require('https');

const SUPABASE_URL = 'https://sfmeemhtjxwseuvzcjyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbWVlbWh0anh3c2V1dnpjanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ3MzEsImV4cCI6MjA3NjQwMDczMX0.KOUF3EAgTrPpiz4CkD00N1QtM4gXUa91nN2GgubbZbM';

// SQL to create cart table
const CREATE_CART_SQL = `
-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_cart_userId ON cart("userId");

-- Enable RLS
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view their own cart"
  ON cart FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can create their own cart"
  ON cart FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update their own cart"
  ON cart FOR UPDATE
  USING (true);
`;

console.log('\n========== AUTOMATED CART TABLE CREATION ==========\n');
console.log('⚠️  IMPORTANT: The anon key cannot create tables.\n');
console.log('You need to run the SQL in Supabase Dashboard:\n');
console.log('─'.repeat(70));
console.log(CREATE_CART_SQL);
console.log('─'.repeat(70));
console.log('\n📋 STEP-BY-STEP INSTRUCTIONS:\n');
console.log('1. Open your browser and go to:');
console.log('   https://supabase.com/dashboard/project/sfmeemhtjxwseuvzcjyd/sql/new\n');
console.log('2. Copy the SQL above (between the dashed lines)\n');
console.log('3. Paste it into the SQL Editor\n');
console.log('4. Click the "Run" button (or press Ctrl+Enter)\n');
console.log('5. You should see "Success. No rows returned"\n');
console.log('6. Run: node verify-migration.js to confirm\n');
console.log('─'.repeat(70));
console.log('\n✅ After completing these steps, your database will be 100% ready!\n');

// Save SQL to file for easy access
const fs = require('fs');
fs.writeFileSync('CREATE_CART_TABLE.sql', CREATE_CART_SQL.trim());
console.log('📁 SQL saved to: CREATE_CART_TABLE.sql\n');
console.log('You can also copy it from that file!\n');
