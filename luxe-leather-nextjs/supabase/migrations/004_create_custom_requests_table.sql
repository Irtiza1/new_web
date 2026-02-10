-- Migration: Create custom_requests table
-- Created: 2026-02-10
-- Description: Custom bespoke product requests from customers

CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  request_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  deadline DATE,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);
