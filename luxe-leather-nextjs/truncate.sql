DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- We don't want to truncate schema migrations table if there is one (Supabase uses something else maybe, but let's be safe and exclude any migrations tracking table if it exists)
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'schema_migrations') 
  LOOP
    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE;';
  END LOOP;
END $$;
