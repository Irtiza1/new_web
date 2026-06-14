-- Migration 020: Make Shipping Dynamic
-- Add shipping_info column to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT '{"policy": "Free Worldwide Shipping", "delivery_regular": "3-5 Working Days", "delivery_custom": "12-15 Working Days"}'::jsonb;

-- Reload Supabase Schema Cache so the REST API picks up the new column immediately
NOTIFY pgrst, 'reload schema';
