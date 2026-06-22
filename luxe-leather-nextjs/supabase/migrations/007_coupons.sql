CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);
