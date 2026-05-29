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
