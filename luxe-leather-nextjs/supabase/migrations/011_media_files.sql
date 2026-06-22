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

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);
