CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email character varying NOT NULL UNIQUE,
    encrypted_password text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Note: In an agnostic database without Supabase Auth, you will need to implement 
-- standard password hashing (like bcrypt) in your application layer before inserting here.
