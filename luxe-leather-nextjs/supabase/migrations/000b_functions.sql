CREATE FUNCTION public.anonymize_customer(p_customer_id uuid) RETURNS void
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

CREATE FUNCTION public.create_order(p_order jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_order_id UUID := gen_random_uuid();
  v_result JSONB;
BEGIN
  INSERT INTO orders (
    id,
    order_number,
    customer_id,
    status,
    total,
    "shippingAddress",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    v_order_id,
    COALESCE(p_order->>'order_number', 'LLG-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || UPPER(RIGHT(REPLACE(v_order_id::TEXT, '-', ''), 6))),
    (p_order->>'customer_id')::UUID,
    COALESCE(p_order->>'status', 'PENDING'),
    (p_order->>'total')::NUMERIC,
    (p_order->>'shippingAddress')::JSONB,
    NOW(),
    NOW()
  );

  SELECT to_jsonb(o) INTO v_result FROM orders o WHERE id = v_order_id;
  RETURN v_result;
END;
$$;

CREATE FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb) RETURNS jsonb
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

CREATE FUNCTION public.delete_order_safe(p_order_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM order_items WHERE order_id = p_order_id;
  DELETE FROM orders       WHERE id      = p_order_id;
END;
$$;

CREATE FUNCTION public.update_orders_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_products_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE FUNCTION public.update_user_roles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.user_profiles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
