# 🔑 Supabase Setup Guide

Complete setup guide for connecting your Next.js app to Supabase.

---

## Step 1: Get Your Supabase Anon Key

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/pgcprmhaalolzjvqfwyo

2. **Navigate to Settings → API:**
   - Click "Settings" in the left sidebar
   - Click "API"

3. **Copy the "anon public" key:**
   - Under "Project API keys"
   - Find the key labeled `anon` or `public`
   - Click the copy icon

4. **Update `.env.local`:**
   Open `.env.local` and replace `your-anon-key-here` with your actual key:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

5. **Restart your dev server:**
   ```bash
   # Stop the current server (Ctrl+C in the terminal)
   npm run dev
   ```

---

## Step 2: Run Database Migrations

We use **individual migration files** (one per entity) for better version control.

### Option A: Supabase Dashboard (Easiest)

1. **Go to Supabase SQL Editor:**
   - Visit: https://supabase.com/dashboard/project/pgcprmhaalolzjvqfwyo/sql

2. **Run each migration in order:**
   
   Open and run these files from `supabase/migrations/`:
   
   - ✅ `001_create_products_table.sql`
   - ✅ `002_create_customers_table.sql`
   - ✅ `003_create_orders_table.sql`
   - ✅ `004_create_custom_requests_table.sql`
   - ✅ `005_seed_products.sql`
   - ✅ `006_seed_customers.sql`

   For each file:
   - Copy the entire content
   - Paste into SQL Editor
   - Click **"Run"**
   - Wait for success message
   - Move to next file

### Option B: Supabase CLI (Advanced)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref pgcprmhaalolzjvqfwyo

# Run all migrations
supabase db push
```

---

## Step 3: Test CRUD Operations

Once you've completed both steps above, test the integration:

### Visit the Products Page:
**http://localhost:3000/products**

You should see:
- ✅ 6 sample products displayed
- ✅ Ability to create new products
- ✅ Edit existing products
- ✅ Delete products

### What You Can Do:

1. **View Products** - See all products from Supabase
2. **Create Product** - Click "Add Product" button
3. **Edit Product** - Click "Edit" on any product card
4. **Delete Product** - Click "Delete" and confirm

---

## Troubleshooting

### Error: "Database Connection Error"

**Cause:** Missing or incorrect Supabase anon key

**Fix:**
1. Check `.env.local` has the correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Restart dev server with `npm run dev`

### Error: "relation 'products' does not exist"

**Cause:** Migrations haven't been run

**Fix:**
Run all 6 migration files in the Supabase SQL Editor (see Step 2)

### No Products Showing

**Cause:** Seed data migration not run

**Fix:**
Run `005_seed_products.sql` in Supabase SQL Editor

---

## What's Next?

Once Supabase is working, you can:
- ✅ Build product listing pages
- ✅ Create shopping cart functionality
- ✅ Add customer management
- ✅ Implement order processing
- ✅ Build admin dashboard

