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
    COALESCE(p_order->>'order_number', 'LLC-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || UPPER(RIGHT(REPLACE(v_order_id::TEXT, '-', ''), 6))),
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
