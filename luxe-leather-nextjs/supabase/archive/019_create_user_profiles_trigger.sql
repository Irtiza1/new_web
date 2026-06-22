-- 019_create_user_profiles_trigger.sql
-- Create a trigger that inserts a row in public.user_profiles when a new auth.users row is created.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- User profile is the source of truth for names/display details.
  INSERT INTO public.user_profiles(user_id, full_name, display_name, created_at, updated_at, metadata)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', NEW.email, ''),
    now(),
    now(),
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_after_insert ON auth.users;
CREATE TRIGGER trg_auth_user_after_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

COMMIT;
