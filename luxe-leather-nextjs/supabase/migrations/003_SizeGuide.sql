CREATE TABLE public."SizeGuide" (
    id text NOT NULL,
    label text NOT NULL,
    chest text NOT NULL,
    waist text NOT NULL,
    hips text NOT NULL,
    shoulders text,
    length text
);

ALTER TABLE public."SizeGuide" OWNER TO postgres;

ALTER TABLE ONLY public."SizeGuide"
    ADD CONSTRAINT "SizeGuide_pkey" PRIMARY KEY (id);

CREATE UNIQUE INDEX "SizeGuide_size_key" ON public."SizeGuide" USING btree (label);
