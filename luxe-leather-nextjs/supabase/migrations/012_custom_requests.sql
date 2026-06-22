CREATE TABLE public.custom_requests (
    id text NOT NULL,
    "customerId" text,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    "itemType" text NOT NULL,
    budget text,
    deadline text,
    description text NOT NULL,
    inspiration text,
    status public."RequestStatus" DEFAULT 'NEW'::public."RequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL
);

ALTER TABLE public.custom_requests OWNER TO postgres;

ALTER TABLE ONLY public.custom_requests
    ADD CONSTRAINT "CustomRequest_pkey" PRIMARY KEY (id);

CREATE INDEX "CustomRequest_email_idx" ON public.custom_requests USING btree (email);

CREATE INDEX "CustomRequest_status_idx" ON public.custom_requests USING btree (status);

CREATE INDEX idx_custom_requests_is_archived ON public.custom_requests USING btree ("isArchived");
