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

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);

CREATE INDEX "OrderItem_orderId_idx" ON public.order_items USING btree (order_id);

CREATE INDEX "OrderItem_productId_idx" ON public.order_items USING btree (product_id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
