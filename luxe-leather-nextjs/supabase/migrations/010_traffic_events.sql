CREATE TABLE public.traffic_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(100) DEFAULT 'page_view'::character varying NOT NULL,
    path text NOT NULL,
    referrer text,
    session_id text NOT NULL,
    country character varying(100),
    region character varying(100),
    city character varying(100),
    device_type character varying(50),
    os character varying(50),
    browser character varying(50),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.traffic_events OWNER TO postgres;

ALTER TABLE ONLY public.traffic_events
    ADD CONSTRAINT traffic_events_pkey PRIMARY KEY (id);

CREATE INDEX idx_traffic_events_created_at ON public.traffic_events USING btree (created_at);

CREATE INDEX idx_traffic_events_event_type ON public.traffic_events USING btree (event_type);
