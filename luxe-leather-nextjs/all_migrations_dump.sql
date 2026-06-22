

-- =====================================
-- FILE: 001_create_products_table.sql
-- =====================================
-- Migration: Create products table
-- Created: 2026-02-10
-- Updated: 2026-04-09 (aligned with actual DB schema — camelCase columns)
-- Description: Products catalog with inventory management

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  images TEXT[],
  stock INTEGER DEFAULT 0,
  sizes TEXT[],
  badge TEXT,
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  "salesCount" INTEGER DEFAULT 0,
  "customSizingPrice" NUMERIC(10, 2),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Create trigger function for updatedAt
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();


-- =====================================
-- FILE: 002_create_customers_table.sql
-- =====================================
-- Migration: Create customers table
-- Created: 2026-02-10
-- Updated: 2026-04-09 (aligned with actual DB schema — camelCase columns)
-- Description: Customer information and contact details

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);


-- =====================================
-- FILE: 003_create_orders_table.sql
-- =====================================
-- Migration: Create orders table
-- Created: 2026-02-10
-- Updated: 2026-04-09 (aligned with actual DB schema — camelCase columns, added order_items)
-- Description: Customer orders with items stored as JSONB

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  shipping DECIMAL(10, 2) DEFAULT 0,
  items JSONB NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table (used by orderService for relational item tracking)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create trigger function for updatedAt
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();


-- =====================================
-- FILE: 004_create_custom_requests_table.sql
-- =====================================
-- Migration: Create custom_requests table
-- Created: 2026-02-10
-- Updated: 2026-04-09 (aligned with actual DB schema — camelCase columns)
-- Description: Custom bespoke product requests from customers

CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone TEXT,
  "itemType" VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  budget TEXT,
  deadline TEXT,
  inspiration TEXT,
  "customerId" UUID,
  status VARCHAR(50) DEFAULT 'new',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);


-- =====================================
-- FILE: 005_seed_products.sql
-- =====================================
-- Migration: Seed products table
-- Created: 2026-02-10
-- Updated: 2026-04-09 (aligned with actual DB schema — camelCase columns)
-- Description: Insert sample products for testing

INSERT INTO products (name, description, price, category, image, stock, sizes) VALUES
  ('Classic Leather Tote', 'Handcrafted tote bag with genuine leather', 149.99, 'Bags', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', 15, ARRAY['One Size']),
  ('Slim Cardholder Wallet', 'Minimalist leather card holder', 34.99, 'Wallets', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', 50, NULL),
  ('Weekend Duffel Bag', 'Spacious travel bag with leather trim', 199.99, 'Bags', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 8, ARRAY['Medium', 'Large']),
  ('Braided Leather Belt', 'Hand-braided leather belt', 49.99, 'Accessories', 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=500', 30, ARRAY['S', 'M', 'L', 'XL']),
  ('Executive Briefcase', 'Professional leather briefcase', 249.99, 'Bags', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 12, ARRAY['One Size']),
  ('Passport Holder', 'Travel-ready leather passport cover', 24.99, 'Accessories', 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500', 40, NULL);


-- =====================================
-- FILE: 006_seed_customers.sql
-- =====================================
-- Migration: Seed customers table
-- Created: 2026-02-10
-- Description: Insert sample customers for testing

INSERT INTO customers (name, email, phone, city, country) VALUES
  ('Sophia Williams', 'sophia.w@example.com', '+1 (555) 123-4567', 'New York', 'USA'),
  ('Liam Brown', 'liam.b@example.com', '+44 20 1234 5678', 'London', 'UK'),
  ('Emma Davis', 'emma.d@example.com', '+61 2 1234 5678', 'Sydney', 'Australia'),
  ('Noah Johnson', 'noah.j@example.com', '+1 (555) 987-6543', 'Los Angeles', 'USA'),
  ('Olivia Martinez', 'olivia.m@example.com', '+34 91 123 4567', 'Madrid', 'Spain');


-- =====================================
-- FILE: 007_create_contact_messages_table.sql
-- =====================================
-- ============================================
-- Luxe Leather — Contact Messages Table
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    inquiry_type TEXT NOT NULL DEFAULT 'Other',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (storefront contact form)
DROP POLICY IF EXISTS "Allow public insert contact_messages" ON contact_messages;
CREATE POLICY "Allow public insert contact_messages"
    ON contact_messages FOR INSERT
    WITH CHECK (true);

-- Allow authenticated/admin to read and update
DROP POLICY IF EXISTS "Allow all read contact_messages" ON contact_messages;
CREATE POLICY "Allow all read contact_messages"
    ON contact_messages FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated update contact_messages" ON contact_messages;
CREATE POLICY "Allow authenticated update contact_messages"
    ON contact_messages FOR UPDATE
    USING (true);

-- Index on status for admin filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);


-- =====================================
-- FILE: 008_create_other_tables.sql
-- =====================================
-- ============================================
-- Luxe Leather — Database Migration
-- Creates new tables: contact_messages, media_files, site_settings
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    inquiry_type TEXT NOT NULL DEFAULT 'Other',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (storefront form), admin reads/updates
DROP POLICY IF EXISTS "Allow public insert contact_messages" ON contact_messages;
CREATE POLICY "Allow public insert contact_messages"
    ON contact_messages FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read contact_messages" ON contact_messages;
CREATE POLICY "Allow authenticated read contact_messages"
    ON contact_messages FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated update contact_messages" ON contact_messages;
CREATE POLICY "Allow authenticated update contact_messages"
    ON contact_messages FOR UPDATE
    USING (true);

-- 2. Media Files
CREATE TABLE IF NOT EXISTS media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    width INTEGER,
    height INTEGER,
    content_type TEXT,
    folder TEXT DEFAULT 'general',
    alt_text TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated all media_files" ON media_files;
CREATE POLICY "Allow authenticated all media_files"
    ON media_files FOR ALL
    USING (true);

-- 3. Site Settings (key-value store)
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site_settings" ON site_settings;
CREATE POLICY "Allow public read site_settings"
    ON site_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated write site_settings" ON site_settings;
CREATE POLICY "Allow authenticated write site_settings"
    ON site_settings FOR ALL
    USING (true);

-- Seed default settings
INSERT INTO site_settings (key, value) VALUES
    ('support_email', 'support@luxeleather.co'),
    ('whatsapp_number', ''),
    ('site_title', 'Luxe Leather'),
    ('meta_description', 'Premium handmade leather goods'),
    ('logo_url', '')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Ensure existing tables have RLS enabled
-- (won't error if already enabled)
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all products" ON products;
CREATE POLICY "Allow all products" ON products FOR ALL USING (true);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all customers" ON customers;
CREATE POLICY "Allow all customers" ON customers FOR ALL USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all orders" ON orders;
CREATE POLICY "Allow all orders" ON orders FOR ALL USING (true);

ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert custom_requests" ON custom_requests;
CREATE POLICY "Allow public insert custom_requests"
    ON custom_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all read custom_requests" ON custom_requests;
CREATE POLICY "Allow all read custom_requests"
    ON custom_requests FOR SELECT USING (true);


-- =====================================
-- FILE: 009_add_stripe_to_orders.sql
-- =====================================
-- Migration: Add Stripe payment columns to orders table
-- Created: 2026-04-10
-- Description: Enables Stripe payment tracking on orders

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

COMMENT ON COLUMN orders.notes IS 'Customer notes from checkout form';
COMMENT ON COLUMN orders.stripe_payment_intent_id IS 'Stripe Payment Intent ID (pi_...)';
COMMENT ON COLUMN orders.stripe_session_id IS 'Stripe Checkout Session ID (not used in Elements flow, kept for flexibility)';
COMMENT ON COLUMN orders.payment_status IS 'unpaid | paid | failed | refunded';


-- =====================================
-- FILE: 010_soft_delete_products.sql
-- =====================================
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


-- =====================================
-- FILE: 011_create_audit_logs.sql
-- =====================================
-- Migration 011: Audit Logs Table
-- Created: 2026-05-21
--
-- Records admin actions on sensitive tables for accountability and debugging.

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name  TEXT        NOT NULL,
  record_id   TEXT        NOT NULL,
  action      TEXT        NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','ARCHIVE','RESTORE','ANONYMIZE')),
  changed_fields JSONB,                          -- { "fieldName": { "from": ..., "to": ... } }
  performed_by   TEXT     DEFAULT 'admin',       -- future: session / user id
  ip_address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name  ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id   ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs(created_at DESC);


-- =====================================
-- FILE: 012_transaction_rpc_functions.sql
-- =====================================
-- Migration 012: PostgreSQL RPC Functions for Atomic Operations
-- Created: 2026-05-21
--
-- Supabase JS client cannot run multi-statement transactions directly.
-- These plpgsql functions execute multi-step operations atomically
-- so that a failure in any step rolls back the entire operation.

-- ============================================================
-- 1. Atomic order creation (order + order_items in one TX)
-- ============================================================
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_order   JSONB,
  p_items   JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id  UUID;
  v_order_row JSONB;
  v_item      JSONB;
BEGIN
  v_order_id := (p_order->>'id')::UUID;

  -- Insert the order
  INSERT INTO orders (
    id, customer_id, status, total, subtotal, shipping,
    items, notes, stripe_session_id, stripe_payment_intent_id,
    payment_status, "createdAt", "updatedAt"
  )
  VALUES (
    v_order_id,
    (p_order->>'customer_id')::UUID,
    COALESCE(p_order->>'status', 'PENDING'),
    (p_order->>'total')::NUMERIC,
    COALESCE((p_order->>'subtotal')::NUMERIC, 0),
    COALESCE((p_order->>'shipping')::NUMERIC, 0),
    p_order->'items',
    p_order->>'notes',
    p_order->>'stripe_session_id',
    p_order->>'stripe_payment_intent_id',
    COALESCE(p_order->>'payment_status', 'unpaid'),
    COALESCE((p_order->>'createdAt')::TIMESTAMPTZ, NOW()),
    COALESCE((p_order->>'updatedAt')::TIMESTAMPTZ, NOW())
  )
  RETURNING to_jsonb(orders.*) INTO v_order_row;

  -- Insert each order_item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (id, order_id, product_id, quantity, price)
    VALUES (
      gen_random_uuid(),
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC
    );
  END LOOP;

  RETURN v_order_row;
END;
$$;

-- ============================================================
-- 2. Atomic order deletion (order_items → order)
-- ============================================================
CREATE OR REPLACE FUNCTION delete_order_safe(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM order_items WHERE order_id = p_order_id;
  DELETE FROM orders       WHERE id      = p_order_id;
END;
$$;

-- ============================================================
-- 3. Atomic customer anonymization
--    Preserves all orders/history; only wipes PII fields.
-- ============================================================
CREATE OR REPLACE FUNCTION anonymize_customer(p_customer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Unlink from custom_requests (nullify FK, keep the request)
  UPDATE custom_requests
  SET    "customerId" = NULL
  WHERE  "customerId" = p_customer_id;

  -- Anonymize the customer row (GDPR-compliant: no hard delete)
  UPDATE customers
  SET
    name       = 'Deleted User',
    email      = 'deleted+' || p_customer_id::TEXT || '@deleted.invalid',
    phone      = NULL,
    address    = NULL,
    city       = NULL,
    country    = NULL,
    "isActive" = FALSE,
    "updatedAt" = NOW()
  WHERE id = p_customer_id;
END;
$$;


-- =====================================
-- FILE: 013_soft_delete_entities.sql
-- =====================================
-- Migration 013: Soft Delete for Orders, Customers & Custom Requests
-- Created: 2026-05-21

-- ============================================================
-- Orders: soft delete flag
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_is_deleted ON orders("isDeleted");

-- ============================================================
-- Customers: active flag + needed for anonymization RPC
-- ============================================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers("isActive");

-- ============================================================
-- Custom Requests: archive flag
-- ============================================================
ALTER TABLE custom_requests
  ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_custom_requests_is_archived ON custom_requests("isArchived");


-- =====================================
-- FILE: 014_add_storefront_columns.sql
-- =====================================
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


-- =====================================
-- FILE: 015_add_featured_tag.sql
-- =====================================
-- Migration 015: Add featured_tag to products table

ALTER TABLE "public"."products" 
ADD COLUMN IF NOT EXISTS "featured_tag" VARCHAR(50) DEFAULT NULL;


-- =====================================
-- FILE: 016_create_user_roles_rbac.sql
-- =====================================
-- Migration 016: RBAC roles for admin and support access
-- Created: 2026-05-26
--
-- Supabase Auth owns account creation and email verification.
-- This table maps verified auth users to application roles.

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'support', 'manager', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON user_roles;
CREATE TRIGGER trigger_user_roles_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_roles_updated_at();

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
CREATE POLICY "Users can read their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages user roles" ON user_roles;
CREATE POLICY "Service role manages user roles"
  ON user_roles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- =====================================
-- FILE: 017_add_order_number.sql
-- =====================================
-- Migration 017: Human-readable order numbers
-- Created: 2026-05-26

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique
  ON orders(order_number)
  WHERE order_number IS NOT NULL;

UPDATE orders
SET order_number = 'LLG-' || TO_CHAR(COALESCE("createdAt", NOW()), 'YYYYMM') || '-' || UPPER(RIGHT(REPLACE(id::TEXT, '-', ''), 6))
WHERE order_number IS NULL;

-- Keep atomic order creation aware of order_number when the app provides it.
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_order   JSONB,
  p_items   JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id  UUID;
  v_order_row JSONB;
  v_item      JSONB;
BEGIN
  v_order_id := (p_order->>'id')::UUID;

  INSERT INTO orders (
    id, order_number, customer_id, status, total, subtotal, shipping,
    items, notes, stripe_session_id, stripe_payment_intent_id,
    payment_status, "createdAt", "updatedAt"
  )
  VALUES (
    v_order_id,
    COALESCE(p_order->>'order_number', 'LLG-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || UPPER(RIGHT(REPLACE(v_order_id::TEXT, '-', ''), 6))),
    (p_order->>'customer_id')::UUID,
    COALESCE(p_order->>'status', 'PENDING'),
    (p_order->>'total')::NUMERIC,
    COALESCE((p_order->>'subtotal')::NUMERIC, 0),
    COALESCE((p_order->>'shipping')::NUMERIC, 0),
    p_order->'items',
    p_order->>'notes',
    p_order->>'stripe_session_id',
    p_order->>'stripe_payment_intent_id',
    COALESCE(p_order->>'payment_status', 'unpaid'),
    COALESCE((p_order->>'createdAt')::TIMESTAMPTZ, NOW()),
    COALESCE((p_order->>'updatedAt')::TIMESTAMPTZ, NOW())
  )
  RETURNING to_jsonb(orders.*) INTO v_order_row;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (id, order_id, product_id, quantity, price)
    VALUES (
      gen_random_uuid(),
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC
    );
  END LOOP;

  RETURN v_order_row;
END;
$$;


-- =====================================
-- FILE: 018_create_user_profiles.sql
-- =====================================
-- 018_create_user_profiles.sql
-- Create a user_profiles table to store profile info for auth.users

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,
  bio text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Index for case-insensitive lookup by display_name
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON public.user_profiles (lower(display_name));

-- Full-text index for search on name/display_name
CREATE INDEX IF NOT EXISTS idx_user_profiles_tsv ON public.user_profiles USING gin (to_tsvector('english', coalesce(full_name,'') || ' ' || coalesce(display_name,'')));

-- Trigger function to keep updated_at current
CREATE OR REPLACE FUNCTION public.user_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.user_profiles_updated_at();

DROP POLICY IF EXISTS "Users can read their own profile" ON public.user_profiles;
CREATE POLICY "Users can read their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage user profiles" ON public.user_profiles;
CREATE POLICY "Service role can manage user profiles"
ON public.user_profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

COMMIT;


-- =====================================
-- FILE: 019_create_user_profiles_trigger.sql
-- =====================================
-- 019_create_user_profiles_trigger.sql
-- Create a trigger that inserts a row in public.user_profiles when a new auth.users row is created.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- User profile is the source of truth for names/display details.
  INSERT INTO public.user_profiles(user_id, full_name, display_name, created_at, updated_at, metadata)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', NEW.email, ''),
    now(),
    now(),
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_after_insert ON auth.users;
CREATE TRIGGER trg_auth_user_after_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

COMMIT;


-- =====================================
-- FILE: 020_update_user_profiles_rls_and_trigger.sql
-- =====================================
-- 020_update_user_profiles_rls_and_trigger.sql
-- Idempotent follow-up for projects that already applied 018/019 before RLS was added.

BEGIN;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.user_profiles;
CREATE POLICY "Users can read their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage user profiles" ON public.user_profiles;
CREATE POLICY "Service role can manage user profiles"
ON public.user_profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles(user_id, full_name, display_name, created_at, updated_at, metadata)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', NEW.email, ''),
    now(),
    now(),
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_after_insert ON auth.users;
CREATE TRIGGER trg_auth_user_after_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

COMMIT;


-- =====================================
-- FILE: 021_create_traffic_events_table.sql
-- =====================================
-- Migration: Create traffic_events table for advanced website traffic tracking
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/pgcprmhaalolzjvqfwyo/sql)

CREATE TABLE IF NOT EXISTS traffic_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL DEFAULT 'page_view',
  path TEXT NOT NULL,
  referrer TEXT,
  session_id TEXT NOT NULL,
  country VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50),
  os VARCHAR(50),
  browser VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices for faster querying
CREATE INDEX IF NOT EXISTS idx_traffic_events_created_at ON traffic_events(created_at);
CREATE INDEX IF NOT EXISTS idx_traffic_events_event_type ON traffic_events(event_type);

-- Enable RLS (Row Level Security) if desired, or allow public insertions:
ALTER TABLE traffic_events ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous insertions (public page tracking)
CREATE POLICY "Allow public inserts on traffic_events" 
ON traffic_events 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy to allow authenticated reads (admin panel dashboard)
CREATE POLICY "Allow auth reads on traffic_events" 
ON traffic_events 
FOR SELECT 
TO authenticated 
USING (true);


-- =====================================
-- FILE (OUT OF PLACE): 019_dynamic_product_fields_migration.sql
-- =====================================
-- Migration 019: Make Storefront details dynamic
-- Add missing columns to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_custom_sizing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_sizing_price NUMERIC DEFAULT 0;

-- Add variant/details to order items
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT;

-- Update the RPC to insert variant data into order_items
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_order   JSONB,
  p_items   JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id  UUID;
  v_order_row JSONB;
  v_item      JSONB;
BEGIN
  v_order_id := (p_order->>'id')::UUID;

  INSERT INTO orders (
    id, order_number, customer_id, status, total, subtotal, shipping,
    items, notes, stripe_session_id, stripe_payment_intent_id,
    payment_status, "createdAt", "updatedAt"
  )
  VALUES (
    v_order_id,
    COALESCE(p_order->>'order_number', 'LLG-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || UPPER(RIGHT(REPLACE(v_order_id::TEXT, '-', ''), 6))),
    (p_order->>'customer_id')::UUID,
    COALESCE(p_order->>'status', 'PENDING'),
    (p_order->>'total')::NUMERIC,
    COALESCE((p_order->>'subtotal')::NUMERIC, 0),
    COALESCE((p_order->>'shipping')::NUMERIC, 0),
    p_order->'items',
    p_order->>'notes',
    p_order->>'stripe_session_id',
    p_order->>'stripe_payment_intent_id',
    COALESCE(p_order->>'payment_status', 'unpaid'),
    COALESCE((p_order->>'createdAt')::TIMESTAMPTZ, NOW()),
    COALESCE((p_order->>'updatedAt')::TIMESTAMPTZ, NOW())
  )
  RETURNING to_jsonb(orders.*) INTO v_order_row;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (id, order_id, product_id, quantity, price, variant, color, size)
    VALUES (
      gen_random_uuid(),
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC,
      v_item->>'variant',
      v_item->>'color',
      v_item->>'size'
    );
  END LOOP;

  RETURN v_order_row;
END;
$$;


-- =====================================
-- FILE (OUT OF PLACE): 020_dynamic_shipping_info_migration.sql
-- =====================================
-- Migration 020: Make Shipping Dynamic
-- Add shipping_info column to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT '{"policy": "Free Worldwide Shipping", "delivery_regular": "3-5 Working Days", "delivery_custom": "12-15 Working Days"}'::jsonb;

-- Reload Supabase Schema Cache so the REST API picks up the new column immediately
NOTIFY pgrst, 'reload schema';


-- =====================================
-- FILE (OUT OF PLACE): multi_image_migration.sql
-- =====================================
-- Add images array column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Optional: Migrate existing single images into the array
UPDATE products 
SET images = ARRAY[image] 
WHERE image IS NOT NULL AND image != '' AND array_length(images, 1) IS NULL;
