CREATE TABLE public.nav_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label character varying(100) NOT NULL,
    url character varying(255) NOT NULL,
    display_order integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    opens_in_new_tab boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.nav_items OWNER TO postgres;

ALTER TABLE ONLY public.nav_items
    ADD CONSTRAINT nav_items_pkey PRIMARY KEY (id);
