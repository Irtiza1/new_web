CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL,
    changed_fields jsonb,
    performed_by text DEFAULT 'admin'::text,
    ip_address text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_logs_action_check CHECK ((action = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text, 'ARCHIVE'::text, 'RESTORE'::text, 'ANONYMIZE'::text])))
);

ALTER TABLE public.audit_logs OWNER TO postgres;

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);

CREATE INDEX idx_audit_logs_record_id ON public.audit_logs USING btree (record_id);

CREATE INDEX idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);
