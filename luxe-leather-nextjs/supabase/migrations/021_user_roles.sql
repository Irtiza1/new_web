CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['customer'::text, 'support'::text, 'manager'::text, 'admin'::text, 'super_admin'::text])))
);

ALTER TABLE public.user_roles OWNER TO postgres;

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id);

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);

CREATE TRIGGER trigger_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_user_roles_updated_at();

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
