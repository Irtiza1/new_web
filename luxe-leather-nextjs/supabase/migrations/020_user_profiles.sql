CREATE TABLE public.user_profiles (
    user_id uuid NOT NULL,
    full_name text,
    display_name text,
    avatar_url text,
    phone text,
    bio text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_profiles OWNER TO postgres;

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);

CREATE INDEX idx_user_profiles_display_name ON public.user_profiles USING btree (lower(display_name));

CREATE INDEX idx_user_profiles_tsv ON public.user_profiles USING gin (to_tsvector('english'::regconfig, ((COALESCE(full_name, ''::text) || ' '::text) || COALESCE(display_name, ''::text))));

CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.user_profiles_updated_at();

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
