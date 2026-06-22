--
-- PostgreSQL database dump
--

\restrict P8pU69ZNJbXpZf3YKFq6l0Ujj29HNnXrP6uQdPCIeZiOUFP6GPg6YnFvrgeoJAn

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'NEW',
    'QUOTE_SENT',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."RequestStatus" OWNER TO postgres;

--
-- Name: anonymize_customer(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

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


ALTER FUNCTION public.anonymize_customer(p_customer_id uuid) OWNER TO postgres;

--
-- Name: create_order(jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

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


ALTER FUNCTION public.create_order(p_order jsonb) OWNER TO postgres;

--
-- Name: create_order_with_items(jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

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


ALTER FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb) OWNER TO postgres;

--
-- Name: delete_order_safe(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_order_safe(p_order_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM order_items WHERE order_id = p_order_id;
  DELETE FROM orders       WHERE id      = p_order_id;
END;
$$;


ALTER FUNCTION public.delete_order_safe(p_order_id uuid) OWNER TO postgres;

--
-- Name: update_orders_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_orders_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_orders_updated_at() OWNER TO postgres;

--
-- Name: update_products_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_products_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_products_updated_at() OWNER TO postgres;

--
-- Name: update_user_roles_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_roles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_roles_updated_at() OWNER TO postgres;

--
-- Name: user_profiles_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.user_profiles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.user_profiles_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SizeGuide; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SizeGuide" (
    id text NOT NULL,
    label text NOT NULL,
    chest text NOT NULL,
    waist text NOT NULL,
    hips text NOT NULL,
    shoulders text,
    length text
);


ALTER TABLE public."SizeGuide" OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL,
    changed_fields jsonb,
    performed_by text DEFAULT 'admin'::text,
    ip_address text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_logs_action_check CHECK ((action = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text, 'ARCHIVE'::text, 'RESTORE'::text, 'ANONYMIZE'::text])))
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    size text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    display_order integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    image_url text
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    inquiry_type text DEFAULT 'Other'::text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contact_messages_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text])))
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coupons (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    discount_type character varying(20) DEFAULT 'percentage'::character varying NOT NULL,
    value numeric(10,2) NOT NULL,
    min_order_amount numeric(10,2),
    max_uses integer,
    uses_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expiry_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.coupons OWNER TO postgres;

--
-- Name: custom_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_requests (
    id text NOT NULL,
    "customerId" text,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    "itemType" text NOT NULL,
    budget text,
    deadline text,
    description text NOT NULL,
    inspiration text,
    status public."RequestStatus" DEFAULT 'NEW'::public."RequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.custom_requests OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    city text,
    country text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: media_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    filename text NOT NULL,
    url text NOT NULL,
    size integer,
    width integer,
    height integer,
    content_type text,
    folder text DEFAULT 'general'::text,
    alt_text text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.media_files OWNER TO postgres;

--
-- Name: nav_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nav_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    label character varying(100) NOT NULL,
    url character varying(255) NOT NULL,
    display_order integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    opens_in_new_tab boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.nav_items OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    size text,
    price double precision NOT NULL,
    variant text,
    color text
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    subtotal double precision NOT NULL,
    shipping double precision DEFAULT 0 NOT NULL,
    total double precision NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    stripe_session_id text,
    stripe_payment_intent_id text,
    payment_status character varying(50) DEFAULT 'unpaid'::character varying,
    "isDeleted" boolean DEFAULT false NOT NULL,
    order_number text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: COLUMN orders.notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.notes IS 'Customer notes from checkout form';


--
-- Name: COLUMN orders.stripe_session_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.stripe_session_id IS 'Stripe Checkout Session ID (not used in Elements flow, kept for flexibility)';


--
-- Name: COLUMN orders.stripe_payment_intent_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Stripe Payment Intent ID (pi_...)';


--
-- Name: COLUMN orders.payment_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.orders.payment_status IS 'unpaid | paid | failed | refunded';


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    image text,
    category text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    sizes text[] DEFAULT ARRAY[]::text[],
    badge text,
    rating double precision DEFAULT 0 NOT NULL,
    reviews integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false,
    featured_tag character varying(50) DEFAULT NULL::character varying,
    images text[] DEFAULT '{}'::text[],
    specs jsonb DEFAULT '[]'::jsonb,
    colors jsonb DEFAULT '[]'::jsonb,
    allow_custom_sizing boolean DEFAULT false,
    custom_sizing_price numeric DEFAULT 0,
    shipping_info jsonb DEFAULT '{"policy": "Free Worldwide Shipping", "delivery_custom": "12-15 Working Days", "delivery_regular": "3-5 Working Days"}'::jsonb
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    product_id uuid,
    customer_name character varying(255) NOT NULL,
    customer_email character varying(255),
    rating integer NOT NULL,
    comment text,
    status character varying(20) DEFAULT 'pending'::character varying,
    is_featured boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: shipping_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_rates (
    id text NOT NULL,
    region text NOT NULL,
    standard double precision NOT NULL,
    express double precision NOT NULL,
    "freeAbove" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.shipping_rates OWNER TO postgres;

--
-- Name: shipping_zones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shipping_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    regions text NOT NULL,
    handling_days integer DEFAULT 7,
    rate numeric DEFAULT 0,
    free_above numeric,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.shipping_zones OWNER TO postgres;

--
-- Name: site_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_content (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    slug character varying(100) NOT NULL,
    content text NOT NULL,
    description text,
    content_type character varying(20) DEFAULT 'text'::character varying,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.site_content OWNER TO postgres;

--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.site_settings OWNER TO postgres;

--
-- Name: traffic_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.traffic_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(100) DEFAULT 'page_view'::character varying NOT NULL,
    path text NOT NULL,
    referrer text,
    session_id text NOT NULL,
    country character varying(100),
    region character varying(100),
    city character varying(100),
    device_type character varying(50),
    os character varying(50),
    browser character varying(50),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.traffic_events OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    user_id uuid NOT NULL,
    full_name text,
    display_name text,
    avatar_url text,
    phone text,
    bio text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['customer'::text, 'support'::text, 'manager'::text, 'admin'::text, 'super_admin'::text])))
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: cart_items CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: custom_requests CustomRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_requests
    ADD CONSTRAINT "CustomRequest_pkey" PRIMARY KEY (id);


--
-- Name: customers Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: order_items OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: orders Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: products Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: shipping_rates ShippingRate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_rates
    ADD CONSTRAINT "ShippingRate_pkey" PRIMARY KEY (id);


--
-- Name: SizeGuide SizeGuide_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SizeGuide"
    ADD CONSTRAINT "SizeGuide_pkey" PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- Name: nav_items nav_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nav_items
    ADD CONSTRAINT nav_items_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: shipping_zones shipping_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shipping_zones
    ADD CONSTRAINT shipping_zones_pkey PRIMARY KEY (id);


--
-- Name: site_content site_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_pkey PRIMARY KEY (id);


--
-- Name: site_content site_content_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_slug_key UNIQUE (slug);


--
-- Name: site_settings site_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_key UNIQUE (key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: traffic_events traffic_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traffic_events
    ADD CONSTRAINT traffic_events_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id);


--
-- Name: CartItem_sessionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CartItem_sessionId_idx" ON public.cart_items USING btree ("sessionId");


--
-- Name: CartItem_sessionId_productId_size_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CartItem_sessionId_productId_size_key" ON public.cart_items USING btree ("sessionId", product_id, size);


--
-- Name: CustomRequest_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomRequest_email_idx" ON public.custom_requests USING btree (email);


--
-- Name: CustomRequest_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomRequest_status_idx" ON public.custom_requests USING btree (status);


--
-- Name: Customer_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customer_email_idx" ON public.customers USING btree (email);


--
-- Name: Customer_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Customer_email_key" ON public.customers USING btree (email);


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_orderId_idx" ON public.order_items USING btree (order_id);


--
-- Name: OrderItem_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrderItem_productId_idx" ON public.order_items USING btree (product_id);


--
-- Name: Order_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_customerId_idx" ON public.orders USING btree (customer_id);


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Order_status_idx" ON public.orders USING btree (status);


--
-- Name: Product_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_category_idx" ON public.products USING btree (category);


--
-- Name: ShippingRate_region_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ShippingRate_region_key" ON public.shipping_rates USING btree (region);


--
-- Name: SizeGuide_size_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SizeGuide_size_key" ON public."SizeGuide" USING btree (label);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_record_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_record_id ON public.audit_logs USING btree (record_id);


--
-- Name: idx_audit_logs_table_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);


--
-- Name: idx_contact_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages USING btree (created_at DESC);


--
-- Name: idx_contact_messages_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contact_messages_status ON public.contact_messages USING btree (status);


--
-- Name: idx_custom_requests_is_archived; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_requests_is_archived ON public.custom_requests USING btree ("isArchived");


--
-- Name: idx_customers_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_is_active ON public.customers USING btree ("isActive");


--
-- Name: idx_orders_is_deleted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_is_deleted ON public.orders USING btree ("isDeleted");


--
-- Name: idx_orders_order_number_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_orders_order_number_unique ON public.orders USING btree (order_number) WHERE (order_number IS NOT NULL);


--
-- Name: idx_orders_payment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_payment_status ON public.orders USING btree (payment_status);


--
-- Name: idx_orders_stripe_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_stripe_session ON public.orders USING btree (stripe_session_id);


--
-- Name: idx_products_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_is_active ON public.products USING btree ("isActive");


--
-- Name: idx_products_is_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_is_featured ON public.products USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_traffic_events_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_traffic_events_created_at ON public.traffic_events USING btree (created_at);


--
-- Name: idx_traffic_events_event_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_traffic_events_event_type ON public.traffic_events USING btree (event_type);


--
-- Name: idx_user_profiles_display_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_display_name ON public.user_profiles USING btree (lower(display_name));


--
-- Name: idx_user_profiles_tsv; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_tsv ON public.user_profiles USING gin (to_tsvector('english'::regconfig, ((COALESCE(full_name, ''::text) || ' '::text) || COALESCE(display_name, ''::text))));


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);


--
-- Name: user_profiles trg_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.user_profiles_updated_at();


--
-- Name: user_roles trigger_user_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_user_roles_updated_at();


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contact_messages Allow all read contact_messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all read contact_messages" ON public.contact_messages FOR SELECT USING (true);


--
-- Name: traffic_events Allow auth reads on traffic_events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow auth reads on traffic_events" ON public.traffic_events FOR SELECT TO authenticated USING (true);


--
-- Name: media_files Allow authenticated all media_files; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated all media_files" ON public.media_files USING (true);


--
-- Name: contact_messages Allow authenticated read contact_messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated read contact_messages" ON public.contact_messages FOR SELECT USING (true);


--
-- Name: contact_messages Allow authenticated update contact_messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated update contact_messages" ON public.contact_messages FOR UPDATE USING (true);


--
-- Name: site_settings Allow authenticated write site_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated write site_settings" ON public.site_settings USING (true);


--
-- Name: contact_messages Allow public insert contact_messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public insert contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (true);


--
-- Name: traffic_events Allow public inserts on traffic_events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public inserts on traffic_events" ON public.traffic_events FOR INSERT WITH CHECK (true);


--
-- Name: site_settings Allow public read site_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read site_settings" ON public.site_settings FOR SELECT USING (true);


--
-- Name: user_roles Service role manages user roles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role manages user roles" ON public.user_roles USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: user_roles Users can read their own role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: media_files; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: traffic_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.traffic_events ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION anonymize_customer(p_customer_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.anonymize_customer(p_customer_id uuid) TO anon;
GRANT ALL ON FUNCTION public.anonymize_customer(p_customer_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.anonymize_customer(p_customer_id uuid) TO service_role;


--
-- Name: FUNCTION create_order(p_order jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_order(p_order jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_order(p_order jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_order(p_order jsonb) TO service_role;


--
-- Name: FUNCTION create_order_with_items(p_order jsonb, p_items jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb) TO service_role;


--
-- Name: FUNCTION delete_order_safe(p_order_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.delete_order_safe(p_order_id uuid) TO anon;
GRANT ALL ON FUNCTION public.delete_order_safe(p_order_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.delete_order_safe(p_order_id uuid) TO service_role;


--
-- Name: FUNCTION update_orders_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_orders_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_orders_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_orders_updated_at() TO service_role;


--
-- Name: FUNCTION update_products_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_products_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_products_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_products_updated_at() TO service_role;


--
-- Name: FUNCTION update_user_roles_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_user_roles_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_user_roles_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_user_roles_updated_at() TO service_role;


--
-- Name: FUNCTION user_profiles_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.user_profiles_updated_at() TO anon;
GRANT ALL ON FUNCTION public.user_profiles_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.user_profiles_updated_at() TO service_role;


--
-- Name: TABLE "SizeGuide"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public."SizeGuide" TO anon;
GRANT ALL ON TABLE public."SizeGuide" TO authenticated;
GRANT ALL ON TABLE public."SizeGuide" TO service_role;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: TABLE cart_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cart_items TO anon;
GRANT ALL ON TABLE public.cart_items TO authenticated;
GRANT ALL ON TABLE public.cart_items TO service_role;


--
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.categories TO service_role;


--
-- Name: TABLE contact_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.contact_messages TO anon;
GRANT ALL ON TABLE public.contact_messages TO authenticated;
GRANT ALL ON TABLE public.contact_messages TO service_role;


--
-- Name: TABLE coupons; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.coupons TO anon;
GRANT ALL ON TABLE public.coupons TO authenticated;
GRANT ALL ON TABLE public.coupons TO service_role;


--
-- Name: TABLE custom_requests; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.custom_requests TO anon;
GRANT ALL ON TABLE public.custom_requests TO authenticated;
GRANT ALL ON TABLE public.custom_requests TO service_role;


--
-- Name: TABLE customers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.customers TO anon;
GRANT ALL ON TABLE public.customers TO authenticated;
GRANT ALL ON TABLE public.customers TO service_role;


--
-- Name: TABLE media_files; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.media_files TO anon;
GRANT ALL ON TABLE public.media_files TO authenticated;
GRANT ALL ON TABLE public.media_files TO service_role;


--
-- Name: TABLE nav_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.nav_items TO anon;
GRANT ALL ON TABLE public.nav_items TO authenticated;
GRANT ALL ON TABLE public.nav_items TO service_role;


--
-- Name: TABLE order_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.order_items TO anon;
GRANT ALL ON TABLE public.order_items TO authenticated;
GRANT ALL ON TABLE public.order_items TO service_role;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;


--
-- Name: TABLE reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.reviews TO anon;
GRANT ALL ON TABLE public.reviews TO authenticated;
GRANT ALL ON TABLE public.reviews TO service_role;


--
-- Name: TABLE shipping_rates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.shipping_rates TO anon;
GRANT ALL ON TABLE public.shipping_rates TO authenticated;
GRANT ALL ON TABLE public.shipping_rates TO service_role;


--
-- Name: TABLE shipping_zones; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.shipping_zones TO anon;
GRANT ALL ON TABLE public.shipping_zones TO authenticated;
GRANT ALL ON TABLE public.shipping_zones TO service_role;


--
-- Name: TABLE site_content; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.site_content TO anon;
GRANT ALL ON TABLE public.site_content TO authenticated;
GRANT ALL ON TABLE public.site_content TO service_role;


--
-- Name: TABLE site_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.site_settings TO anon;
GRANT ALL ON TABLE public.site_settings TO authenticated;
GRANT ALL ON TABLE public.site_settings TO service_role;


--
-- Name: TABLE traffic_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.traffic_events TO anon;
GRANT ALL ON TABLE public.traffic_events TO authenticated;
GRANT ALL ON TABLE public.traffic_events TO service_role;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_profiles TO anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- Name: TABLE user_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_roles TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict P8pU69ZNJbXpZf3YKFq6l0Ujj29HNnXrP6uQdPCIeZiOUFP6GPg6YnFvrgeoJAn

