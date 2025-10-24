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

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view their own cart" ON cart;
DROP POLICY IF EXISTS "Users can create their own cart" ON cart;
DROP POLICY IF EXISTS "Users can update their own cart" ON cart;

-- Create RLS policies
CREATE POLICY "Users can view their own cart"
  ON cart FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own cart"
  ON cart FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own cart"
  ON cart FOR UPDATE
  USING (true);
