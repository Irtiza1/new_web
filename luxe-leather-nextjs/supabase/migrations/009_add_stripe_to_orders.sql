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
