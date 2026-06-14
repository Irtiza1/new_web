-- ==============================================================================
-- Script: Create Admin User directly via SQL
-- Usage: Run this in the Supabase SQL Editor
-- Note: Replace 'admin@luxeleather.co' and 'LuxeAdmin123!' if desired.
-- ==============================================================================

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  target_email TEXT := 'admin@luxeleather.co';
  target_password TEXT := 'LuxeAdmin123!';
BEGIN
  -- 1. Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    target_email,
    crypt(target_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Insert into auth.identities (Required for Supabase Auth to work properly)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::text,
    format('{"sub":"%s","email":"%s"}', new_user_id::text, target_email)::jsonb,
    'email',
    now(),
    now(),
    now()
  );

  -- 3. Insert into public.user_roles to grant the admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  -- 4. Insert into public.user_profiles
  INSERT INTO public.user_profiles (user_id, full_name, display_name)
  VALUES (new_user_id, 'Admin User', 'Admin')
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Admin user created! Email: %, Password: %', target_email, target_password;
END $$;
