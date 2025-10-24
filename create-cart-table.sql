-- Create cart table for shopping cart functionality
-- Run this in Supabase SQL Editor

-- Create cart table
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups by userId
CREATE INDEX IF NOT EXISTS idx_cart_userId ON cart("userId");

-- Add comments
COMMENT ON TABLE cart IS 'Shopping carts for users';
COMMENT ON COLUMN cart."userId" IS 'References the user who owns this cart';

-- Verify both cart tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cart', 'cart_items')
ORDER BY table_name;
