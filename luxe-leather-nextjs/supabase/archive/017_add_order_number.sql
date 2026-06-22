-- Migration 017: Human-readable order numbers
-- Created: 2026-05-26

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number_unique
  ON orders(order_number)
  WHERE order_number IS NOT NULL;

UPDATE orders
SET order_number = 'LLG-' || TO_CHAR(COALESCE("createdAt", NOW()), 'YYYYMM') || '-' || UPPER(RIGHT(REPLACE(id::TEXT, '-', ''), 6))
WHERE order_number IS NULL;

-- Keep atomic order creation aware of order_number when the app provides it.
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
    COALESCE(p_order->>'order_number', 'LLG-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || UPPER(RIGHT(REPLACE(v_order_id::TEXT, '-', ''), 6))),
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
