CREATE TABLE public.cart_items (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    size text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public.cart_items OWNER TO postgres;

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);

CREATE INDEX "CartItem_sessionId_idx" ON public.cart_items USING btree ("sessionId");

CREATE UNIQUE INDEX "CartItem_sessionId_productId_size_key" ON public.cart_items USING btree ("sessionId", product_id, size);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
