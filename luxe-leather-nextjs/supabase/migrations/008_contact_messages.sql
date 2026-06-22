CREATE TABLE public.contact_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    inquiry_type text DEFAULT 'Other'::text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contact_messages_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text])))
);

ALTER TABLE public.contact_messages OWNER TO postgres;

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages USING btree (created_at DESC);

CREATE INDEX idx_contact_messages_status ON public.contact_messages USING btree (status);
