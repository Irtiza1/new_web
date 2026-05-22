-- Migration 010: Soft Delete for Products + cart_items FK CASCADE
-- Created: 2026-05-21
--
-- Changes:
--   1. Add `isActive` column to products (default true)
--   2. Drop the old cart_items FK (RESTRICT) and re-add with ON DELETE CASCADE
--      so that if a hard-delete ever happens, cart rows are cleaned up at DB level
--   3. order_items FK stays as-is (no action) — we BLOCK deletes at app level

-- Step 1: Add soft-delete column
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

-- Step 2: Index for fast filtering of active products
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products("isActive");

-- Step 3: Fix cart_items FK to CASCADE on product delete
--   (find the exact constraint name first if it differs in your DB)
ALTER TABLE cart_items
    DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;

ALTER TABLE cart_items
    ADD CONSTRAINT cart_items_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE;
