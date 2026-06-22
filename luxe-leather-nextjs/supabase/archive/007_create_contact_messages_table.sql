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
