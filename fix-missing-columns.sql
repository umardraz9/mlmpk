-- Fix missing columns for complete order flow
-- Run this in Supabase SQL Editor

-- 1. Add paymentProof column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "paymentProof" TEXT;

COMMENT ON COLUMN orders."paymentProof" IS 'URL to payment proof/screenshot uploaded by customer';

-- 2. Fix cart_items to have auto-generated ID
ALTER TABLE cart_items 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 3. Check favorites table structure and add productId if needed
-- First check if column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'favorites' 
    AND column_name = 'productId'
  ) THEN
    ALTER TABLE favorites ADD COLUMN "productId" TEXT NOT NULL;
    ALTER TABLE favorites ADD CONSTRAINT favorites_productId_fkey 
      FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Ensure order_items has proper foreign key constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'order_items_orderId_fkey'
  ) THEN
    ALTER TABLE order_items
    ADD CONSTRAINT order_items_orderId_fkey 
    FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'order_items_productId_fkey'
  ) THEN
    ALTER TABLE order_items
    ADD CONSTRAINT order_items_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_paymentProof ON orders("paymentProof");
CREATE INDEX IF NOT EXISTS idx_favorites_productId ON favorites("productId");

-- 6. Verify the changes
SELECT 
  'orders' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name = 'paymentProof';

SELECT 
  'favorites' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'favorites'
  AND column_name = 'productId';

SELECT 
  'cart_items' as table_name,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_name = 'cart_items'
  AND column_name = 'id';
