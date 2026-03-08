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
    created_at TIMESTAMPTZ DEFAULT now()
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
    updated_at TIMESTAMPTZ DEFAULT now()
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
