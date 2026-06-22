CREATE TABLE public.site_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(100) NOT NULL,
    content text NOT NULL,
    description text,
    content_type character varying(20) DEFAULT 'text'::character varying,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.site_content OWNER TO postgres;

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.site_content
    ADD CONSTRAINT site_content_slug_key UNIQUE (slug);
