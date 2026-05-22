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
