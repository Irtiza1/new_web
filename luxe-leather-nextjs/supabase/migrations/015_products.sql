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

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);

CREATE INDEX "Product_category_idx" ON public.products USING btree (category);

CREATE INDEX idx_products_is_active ON public.products USING btree ("isActive");

CREATE INDEX idx_products_is_featured ON public.products USING btree (is_featured) WHERE (is_featured = true);
