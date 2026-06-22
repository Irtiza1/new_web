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

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);

CREATE INDEX "Order_customerId_idx" ON public.orders USING btree (customer_id);

CREATE INDEX "Order_status_idx" ON public.orders USING btree (status);

CREATE INDEX idx_orders_is_deleted ON public.orders USING btree ("isDeleted");

CREATE UNIQUE INDEX idx_orders_order_number_unique ON public.orders USING btree (order_number) WHERE (order_number IS NOT NULL);

CREATE INDEX idx_orders_payment_status ON public.orders USING btree (payment_status);

CREATE INDEX idx_orders_stripe_session ON public.orders USING btree (stripe_session_id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
