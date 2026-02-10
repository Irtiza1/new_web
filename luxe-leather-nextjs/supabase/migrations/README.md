# Database Migrations

This directory contains database migrations for the Luxe Leather Co. project.

## Migration Files

Migrations are numbered sequentially and should be run in order:

1. **001_create_products_table.sql** - Products catalog table
2. **002_create_customers_table.sql** - Customer information table
3. **003_create_orders_table.sql** - Orders table with customer relationship
4. **004_create_custom_requests_table.sql** - Custom bespoke requests table
5. **005_seed_products.sql** - Sample products data
6. **006_seed_customers.sql** - Sample customers data

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for Initial Setup)

1. Go to your Supabase SQL Editor:
   - https://supabase.com/dashboard/project/pgcprmhaalolzjvqfwyo/sql

2. Run each migration file in order:
   - Copy the contents of `001_create_products_table.sql`
   - Paste into the SQL Editor
   - Click "Run"
   - Repeat for each migration file in numerical order

### Option 2: Supabase CLI (For Automated Migrations)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref pgcprmhaalolzjvqfwyo

# Run all migrations
supabase db push
```

### Option 3: Manual via psql

```bash
psql "postgresql://postgres:Irtiza1@supabase@db.pgcprmhaalolzjvqfwyo.supabase.co:5432/postgres" \
  -f supabase/migrations/001_create_products_table.sql
```

## Migration Best Practices

- ✅ **One entity per migration** - Each table gets its own migration file
- ✅ **Sequential numbering** - Migrations run in order (001, 002, 003...)
- ✅ **Idempotent** - Use `IF NOT EXISTS` to allow re-running
- ✅ **Separate data migrations** - Seed data in separate files from schema
- ✅ **Never modify existing migrations** - Create new ones for changes

## Adding New Migrations

When adding a new migration:

1. Create a new file with the next number: `007_your_migration_name.sql`
2. Add up migration logic (create/alter table)
3. Test locally before running in production
4. Update this README with the new migration

## Rollback Strategy

To rollback a migration, create a new migration that reverses the changes:

```sql
-- 007_rollback_feature.sql
DROP TABLE IF EXISTS feature_table;
```
