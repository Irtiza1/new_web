-- Migration 014: Add Front-end Customization Columns
-- Created: 2026-05-22
--
-- Adds image support to categories and explicit feature toggling for products.

-- 1. Add image_url to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Add is_featured to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Optional: Create an index on is_featured for faster storefront queries
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
