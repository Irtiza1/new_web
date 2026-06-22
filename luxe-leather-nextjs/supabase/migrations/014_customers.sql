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

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);

CREATE INDEX "Customer_email_idx" ON public.customers USING btree (email);

CREATE UNIQUE INDEX "Customer_email_key" ON public.customers USING btree (email);

CREATE INDEX idx_customers_is_active ON public.customers USING btree ("isActive");
