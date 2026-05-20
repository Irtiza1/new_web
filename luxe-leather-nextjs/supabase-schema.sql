-- Luxe Leather Co. Database Schema (Consolidated Reference)
-- Updated: 2026-04-09
-- This file reflects the actual Supabase database schema.
-- For fresh setup, run migrations 001-008 in order, or use this file directly.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Products Table
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- ============================================
-- Customers Table
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ============================================
-- Orders Table
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  shipping DECIMAL(10, 2) DEFAULT 0,
  items JSONB NOT NULL,
  notes TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================
-- Order Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL
);

-- ============================================
-- Custom Requests Table
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);

-- ============================================
-- Contact Messages Table
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

-- ============================================
-- Media Files Table
-- ============================================
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

-- ============================================
-- Site Settings Table (key-value store)
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Triggers for updatedAt
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed default settings
-- ============================================
INSERT INTO site_settings (key, value) VALUES
    ('support_email', 'support@luxeleather.co'),
    ('whatsapp_number', ''),
    ('site_title', 'Luxe Leather'),
    ('meta_description', 'Premium handmade leather goods'),
    ('logo_url', '')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Sample data
-- ============================================
INSERT INTO products (name, description, price, category, image, stock, sizes) VALUES
  ('Classic Leather Tote', 'Handcrafted tote bag with genuine leather', 149.99, 'Bags', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500', 15, ARRAY['One Size']),
  ('Slim Cardholder Wallet', 'Minimalist leather card holder', 34.99, 'Wallets', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500', 50, NULL),
  ('Weekend Duffel Bag', 'Spacious travel bag with leather trim', 199.99, 'Bags', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 8, ARRAY['Medium', 'Large']),
  ('Braided Leather Belt', 'Hand-braided leather belt', 49.99, 'Accessories', 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=500', 30, ARRAY['S', 'M', 'L', 'XL']),
  ('Executive Briefcase', 'Professional leather briefcase', 249.99, 'Bags', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', 12, ARRAY['One Size']),
  ('Passport Holder', 'Travel-ready leather passport cover', 24.99, 'Accessories', 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500', 40, NULL);

INSERT INTO customers (name, email, phone, city, country) VALUES
  ('Sophia Williams', 'sophia.w@example.com', '+1 (555) 123-4567', 'New York', 'USA'),
  ('Liam Brown', 'liam.b@example.com', '+44 20 1234 5678', 'London', 'UK'),
  ('Emma Davis', 'emma.d@example.com', '+61 2 1234 5678', 'Sydney', 'Australia');
