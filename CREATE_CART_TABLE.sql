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