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

ALTER TABLE ONLY public.shipping_rates
    ADD CONSTRAINT "ShippingRate_pkey" PRIMARY KEY (id);

CREATE UNIQUE INDEX "ShippingRate_region_key" ON public.shipping_rates USING btree (region);
