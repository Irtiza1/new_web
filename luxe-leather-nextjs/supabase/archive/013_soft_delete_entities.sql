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
