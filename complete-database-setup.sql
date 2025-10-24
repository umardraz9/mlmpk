-- ========================================
-- COMPLETE SUPABASE DATABASE SETUP
-- ========================================
-- This migration adds the missing cart table
-- and ensures all tables have proper indexes and constraints
-- Run this in Supabase SQL Editor

-- ========================================
-- 1. CREATE MISSING CART TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_cart_userId ON cart("userId");

-- Add comments
COMMENT ON TABLE cart IS 'Shopping carts for users';
COMMENT ON COLUMN cart."userId" IS 'User ID who owns this cart';

-- ========================================
-- 2. ENSURE CART_ITEMS HAS PROPER FOREIGN KEY
-- ========================================

-- Add foreign key to cart table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cart_items_cartId_fkey' 
    AND table_name = 'cart_items'
  ) THEN
    ALTER TABLE cart_items
    ADD CONSTRAINT cart_items_cartId_fkey 
    FOREIGN KEY ("cartId") REFERENCES cart(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key to products table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cart_items_productId_fkey' 
    AND table_name = 'cart_items'
  ) THEN
    ALTER TABLE cart_items
    ADD CONSTRAINT cart_items_productId_fkey 
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ========================================
-- 3. ADD USEFUL INDEXES FOR PERFORMANCE
-- ========================================

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_cartId ON cart_items("cartId");
CREATE INDEX IF NOT EXISTS idx_cart_items_productId ON cart_items("productId");

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products("categoryId");
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_createdAt ON products("createdAt" DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders("userId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders("createdAt" DESC);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_productId ON order_items("productId");

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Blog posts indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_authorId ON blog_posts("authorId");
CREATE INDEX IF NOT EXISTS idx_blog_posts_createdAt ON blog_posts("createdAt" DESC);

-- Social posts indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_userId ON social_posts("userId");
CREATE INDEX IF NOT EXISTS idx_social_posts_createdAt ON social_posts("createdAt" DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications("createdAt" DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_userId ON tasks("userId");
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_createdAt ON tasks("createdAt" DESC);

-- ========================================
-- 4. ADD ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on cart table
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own cart
CREATE POLICY IF NOT EXISTS "Users can view their own cart"
  ON cart FOR SELECT
  USING (auth.uid()::text = "userId");

-- Policy: Users can create their own cart
CREATE POLICY IF NOT EXISTS "Users can create their own cart"
  ON cart FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- Policy: Users can update their own cart
CREATE POLICY IF NOT EXISTS "Users can update their own cart"
  ON cart FOR UPDATE
  USING (auth.uid()::text = "userId");

-- Enable RLS on cart_items table
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view items in their cart
CREATE POLICY IF NOT EXISTS "Users can view their cart items"
  ON cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items."cartId" 
      AND cart."userId" = auth.uid()::text
    )
  );

-- Policy: Users can add items to their cart
CREATE POLICY IF NOT EXISTS "Users can add items to their cart"
  ON cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items."cartId" 
      AND cart."userId" = auth.uid()::text
    )
  );

-- Policy: Users can update items in their cart
CREATE POLICY IF NOT EXISTS "Users can update their cart items"
  ON cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items."cartId" 
      AND cart."userId" = auth.uid()::text
    )
  );

-- Policy: Users can delete items from their cart
CREATE POLICY IF NOT EXISTS "Users can delete items from their cart"
  ON cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cart 
      WHERE cart.id = cart_items."cartId" 
      AND cart."userId" = auth.uid()::text
    )
  );

-- ========================================
-- 5. CREATE UPDATED_AT TRIGGER FUNCTION
-- ========================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to cart table
DROP TRIGGER IF EXISTS update_cart_updated_at ON cart;
CREATE TRIGGER update_cart_updated_at
  BEFORE UPDATE ON cart
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. VERIFICATION QUERIES
-- ========================================

-- List all tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify cart table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'cart'
ORDER BY ordinal_position;

-- Verify cart_items foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'cart_items';

-- Count records in each table
SELECT 
  'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'product_categories', COUNT(*) FROM product_categories
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'cart', COUNT(*) FROM cart
UNION ALL
SELECT 'cart_items', COUNT(*) FROM cart_items
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY table_name;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- All tables are now set up with proper:
-- ✅ Cart table created
-- ✅ Foreign keys established
-- ✅ Indexes for performance
-- ✅ Row Level Security policies
-- ✅ Updated_at triggers
-- ========================================
