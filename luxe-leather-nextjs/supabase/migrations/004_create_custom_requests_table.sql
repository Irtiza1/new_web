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
